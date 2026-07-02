import User from "../models/User.model.js";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";
import sequelize from "../clients/postgres-client.js";
// GET /api/admin/users — list all users
export const listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "username", "email", "firstName", "lastName", "role", "color", "createdAt"],
            order: [["createdAt", "ASC"]],
        });
        res.json(users);
    }
    catch (error) {
        console.error("Admin List Users Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/admin/users/:id/role — set a user's role (student | organiser | admin)
export const setUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["student", "organiser", "admin"].includes(role)) {
            res.status(400).json({ message: "Role must be 'student', 'organiser', or 'admin'." });
            return;
        }
        const { id } = req.params;
        if (id === req.user.id) {
            res.status(400).json({ message: "You cannot change your own role." });
            return;
        }
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        user.role = role;
        await user.save();
        res.json({
            message: `User ${user.username} is now a ${role}.`,
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        });
    }
    catch (error) {
        console.error("Admin Set Role Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/admin/events — all events with organiser info
export const listAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll({
            include: [{ model: User, as: "organiser", attributes: ["id", "username", "email"] }],
            order: [["createdAt", "DESC"]],
        });
        res.json(events);
    }
    catch (error) {
        console.error("Admin List Events Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/admin/events/:id/cancel — admin cancels any event
export const cancelAnyEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findByPk(id);
        if (!event) {
            res.status(404).json({ message: "Event not found." });
            return;
        }
        await sequelize.transaction(async (t) => {
            event.status = "cancelled";
            await event.save({ transaction: t });
            await Registration.update({ status: "cancelled", waitlistPosition: null }, { where: { eventId: id, status: "waitlisted" }, transaction: t });
        });
        res.json({ message: "Event cancelled." });
    }
    catch (error) {
        console.error("Admin Cancel Event Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// DELETE /api/admin/events/:id — admin deletes any event
export const deleteAnyEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findByPk(id);
        if (!event) {
            res.status(404).json({ message: "Event not found." });
            return;
        }
        await Registration.destroy({ where: { eventId: id } });
        await event.destroy();
        res.json({ message: "Event deleted." });
    }
    catch (error) {
        console.error("Admin Delete Event Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const verifyOrganisation = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        organisation.status = "verified";
        await organisation.save();
        res.json({ message: "Organisation verified.", organisation });
    }
    catch (error) {
        console.error("Admin Verify Organisation Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const deleteOrganisation = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        await OrganisationMember.destroy({ where: { organisationId: id } });
        await organisation.destroy();
        res.json({ message: "Organisation deleted." });
    }
    catch (error) {
        console.error("Admin Delete Organisation Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=admin-controller.js.map