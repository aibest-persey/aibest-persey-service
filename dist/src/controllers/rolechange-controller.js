import RoleChangeRequest from "../models/RoleChangeRequest.model.js";
import User from "../models/User.model.js";
const STUDENT_ATTRS = ["id", "username", "email", "firstName", "lastName", "color"];
// POST /api/role-requests — student submits request to become organiser
export const submitRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const existing = await RoleChangeRequest.findOne({
            where: { studentId: req.user.id, status: "pending" },
        });
        if (existing) {
            res.status(409).json({ message: "You already have a pending role change request." });
            return;
        }
        const request = await RoleChangeRequest.create({
            studentId: req.user.id,
            requestedRole: "organiser",
            reason: reason?.trim() || null,
        });
        res.status(201).json(request);
    }
    catch (error) {
        console.error("Submit Role Request Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/role-requests/my — student's own requests
export const getMyRequests = async (req, res) => {
    try {
        const requests = await RoleChangeRequest.findAll({
            where: { studentId: req.user.id },
            order: [["createdAt", "DESC"]],
        });
        res.json(requests);
    }
    catch (error) {
        console.error("Get My Requests Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/role-requests — all requests (admin / organiser)
export const listAllRequests = async (req, res) => {
    try {
        const requests = await RoleChangeRequest.findAll({
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "student", attributes: STUDENT_ATTRS }],
        });
        res.json(requests);
    }
    catch (error) {
        console.error("List All Requests Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/role-requests/pending — pending requests only (admin / organiser)
export const listPending = async (req, res) => {
    try {
        const requests = await RoleChangeRequest.findAll({
            where: { status: "pending" },
            order: [["createdAt", "ASC"]],
            include: [{ model: User, as: "student", attributes: STUDENT_ATTRS }],
        });
        res.json(requests);
    }
    catch (error) {
        console.error("List Pending Requests Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/role-requests/:id/approve — admin or organiser approves
export const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await RoleChangeRequest.findByPk(id);
        if (!request) {
            res.status(404).json({ message: "Request not found." });
            return;
        }
        if (request.status !== "pending") {
            res.status(400).json({ message: "Request is already resolved." });
            return;
        }
        const student = await User.findByPk(request.studentId);
        if (!student) {
            res.status(404).json({ message: "Student not found." });
            return;
        }
        student.role = request.requestedRole;
        await student.save();
        request.status = "approved";
        request.reviewedBy = req.user.id;
        request.reviewedAt = new Date();
        await request.save();
        res.json({
            message: `${student.username} is now an ${request.requestedRole}.`,
            request,
        });
    }
    catch (error) {
        console.error("Approve Request Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/role-requests/:id/reject — admin or organiser rejects
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await RoleChangeRequest.findByPk(id);
        if (!request) {
            res.status(404).json({ message: "Request not found." });
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
        res.json({ message: "Request rejected.", request });
    }
    catch (error) {
        console.error("Reject Request Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=rolechange-controller.js.map