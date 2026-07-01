import { Op } from "sequelize";
import User from "../models/User.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";
import OrganisationJoinRequest from "../models/OrganisationJoinRequest.model.js";
const getMembership = async (organisationId, userId) => {
    return OrganisationMember.findOne({
        where: { organisationId, userId },
    });
};
const canManageOrganisation = (membership) => {
    return membership?.role === "owner" || membership?.role === "manager";
};
export const createOrganisation = async (req, res) => {
    try {
        if (req.user.role !== "organiser" && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisers can create organisations." });
            return;
        }
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ message: "Organisation name is required." });
            return;
        }
        const existing = await Organisation.findOne({ where: { name } });
        if (existing) {
            res.status(400).json({ message: "An organisation with that name already exists." });
            return;
        }
        const organisation = await Organisation.create({
            name,
            description: description ?? null,
            status: "pending",
            createdBy: req.user.id,
        });
        await OrganisationMember.create({
            organisationId: organisation.id,
            userId: req.user.id,
            role: "owner",
        });
        res.status(201).json({
            message: "Organisation created in pending review.",
            organisation,
        });
    }
    catch (error) {
        console.error("Create Organisation Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const listOrganisations = async (req, res) => {
    try {
        const memberships = await OrganisationMember.findAll({
            where: { userId: req.user.id },
            attributes: ["organisationId"],
        });
        const membershipIds = new Set(memberships.map((m) => m.organisationId));
        if (req.user.role === "admin") {
            const organisations = await Organisation.findAll({ order: [["createdAt", "DESC"]] });
            res.json(organisations.map((o) => ({ ...o.toJSON(), isMember: membershipIds.has(o.id) })));
            return;
        }
        const organisations = await Organisation.findAll({
            where: {
                [Op.or]: [
                    { status: "verified" },
                    { id: { [Op.in]: Array.from(membershipIds) } },
                ],
            },
            order: [["createdAt", "DESC"]],
        });
        res.json(organisations.map((o) => ({ ...o.toJSON(), isMember: membershipIds.has(o.id) })));
    }
    catch (error) {
        console.error("List Organisations Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const getOrganisation = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (organisation.status === "pending" && !membership && req.user.role !== "admin") {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        res.json({
            ...organisation.toJSON(),
            isMember: Boolean(membership),
            myRole: membership?.role ?? null,
        });
    }
    catch (error) {
        console.error("Get Organisation Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const getOrganisationMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!membership && req.user.role !== "admin") {
            res.status(403).json({ message: "Access denied." });
            return;
        }
        const members = await OrganisationMember.findAll({
            where: { organisationId: id },
            include: [{ model: User, as: "user", attributes: ["id", "username", "email", "firstName", "lastName", "color"] }],
            order: [["createdAt", "ASC"]],
        });
        res.json(members.map((member) => ({
            id: member.id,
            role: member.role,
            user: member.user,
            createdAt: member.createdAt,
        })));
    }
    catch (error) {
        console.error("List Organisation Members Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const addOrganisationMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;
        if (!userId || !role) {
            res.status(400).json({ message: "userId and role are required." });
            return;
        }
        if (!["member", "manager"].includes(role)) {
            res.status(400).json({ message: "Role must be 'member' or 'manager'." });
            return;
        }
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can add members." });
            return;
        }
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
        }
        const existing = await OrganisationMember.findOne({ where: { organisationId: id, userId } });
        if (existing) {
            res.status(400).json({ message: "User is already a member of this organisation." });
            return;
        }
        const member = await OrganisationMember.create({ organisationId: id, userId, role });
        res.status(201).json({ message: "Member added.", member });
    }
    catch (error) {
        console.error("Add Organisation Member Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const updateOrganisationMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const { role } = req.body;
        if (!role) {
            res.status(400).json({ message: "Role is required." });
            return;
        }
        if (!["member", "manager"].includes(role)) {
            res.status(400).json({ message: "Role must be 'member' or 'manager'." });
            return;
        }
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can change member roles." });
            return;
        }
        const member = await OrganisationMember.findByPk(memberId);
        if (!member || member.organisationId !== id) {
            res.status(404).json({ message: "Organisation member not found." });
            return;
        }
        if (member.role === "owner") {
            res.status(400).json({ message: "Owner role cannot be changed through this endpoint." });
            return;
        }
        member.role = role;
        await member.save();
        res.json({ message: "Member role updated.", member });
    }
    catch (error) {
        console.error("Update Organisation Member Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const removeOrganisationMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can remove members." });
            return;
        }
        const member = await OrganisationMember.findByPk(memberId);
        if (!member || member.organisationId !== id) {
            res.status(404).json({ message: "Organisation member not found." });
            return;
        }
        if (member.role === "owner") {
            res.status(400).json({ message: "Cannot remove the organisation owner." });
            return;
        }
        await member.destroy();
        res.json({ message: "Member removed." });
    }
    catch (error) {
        console.error("Remove Organisation Member Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// POST /api/organisations/:id/join-requests — any authenticated user requests to join
export const requestToJoinOrganisation = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation || organisation.status !== "verified") {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const existingMembership = await getMembership(id, req.user.id);
        if (existingMembership) {
            res.status(400).json({ message: "You are already a member of this organisation." });
            return;
        }
        const existingRequest = await OrganisationJoinRequest.findOne({
            where: { organisationId: id, studentId: req.user.id, status: "pending" },
        });
        if (existingRequest) {
            res.status(409).json({ message: "You already have a pending request to join this organisation." });
            return;
        }
        const request = await OrganisationJoinRequest.create({
            organisationId: id,
            studentId: req.user.id,
        });
        res.status(201).json(request);
    }
    catch (error) {
        console.error("Request To Join Organisation Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/organisations/:id/join-requests — owner/manager only
export const listJoinRequestsForOrg = async (req, res) => {
    try {
        const { id } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can view join requests." });
            return;
        }
        const requests = await OrganisationJoinRequest.findAll({
            where: { organisationId: id, status: "pending" },
            order: [["createdAt", "ASC"]],
            include: [{ model: User, as: "student", attributes: ["id", "username", "email", "firstName", "lastName", "color"] }],
        });
        res.json(requests);
    }
    catch (error) {
        console.error("List Join Requests Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/organisations/join-requests/my — the caller's own requests, across all orgs
export const getMyJoinRequests = async (req, res) => {
    try {
        const requests = await OrganisationJoinRequest.findAll({
            where: { studentId: req.user.id },
            order: [["createdAt", "DESC"]],
        });
        res.json(requests);
    }
    catch (error) {
        console.error("Get My Join Requests Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/organisations/:id/join-requests/:reqId/approve — owner/manager only
export const approveJoinRequest = async (req, res) => {
    try {
        const { id, reqId } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can approve join requests." });
            return;
        }
        const request = await OrganisationJoinRequest.findByPk(reqId);
        if (!request || request.organisationId !== id) {
            res.status(404).json({ message: "Join request not found." });
            return;
        }
        if (request.status !== "pending") {
            res.status(400).json({ message: "Request is already resolved." });
            return;
        }
        const existingMembership = await getMembership(id, request.studentId);
        if (!existingMembership) {
            await OrganisationMember.create({ organisationId: id, userId: request.studentId, role: "member" });
        }
        request.status = "approved";
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        await request.save();
        res.json({ message: "Join request approved.", request });
    }
    catch (error) {
        console.error("Approve Join Request Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/organisations/:id/join-requests/:reqId/reject — owner/manager only
export const rejectJoinRequest = async (req, res) => {
    try {
        const { id, reqId } = req.params;
        const organisation = await Organisation.findByPk(id);
        if (!organisation) {
            res.status(404).json({ message: "Organisation not found." });
            return;
        }
        const membership = await getMembership(id, req.user.id);
        if (!canManageOrganisation(membership) && req.user.role !== "admin") {
            res.status(403).json({ message: "Only organisation owners or managers can reject join requests." });
            return;
        }
        const request = await OrganisationJoinRequest.findByPk(reqId);
        if (!request || request.organisationId !== id) {
            res.status(404).json({ message: "Join request not found." });
            return;
        }
        if (request.status !== "pending") {
            res.status(400).json({ message: "Request is already resolved." });
            return;
        }
        request.status = "rejected";
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        await request.save();
        res.json({ message: "Join request rejected.", request });
    }
    catch (error) {
        console.error("Reject Join Request Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=organisation-controller.js.map