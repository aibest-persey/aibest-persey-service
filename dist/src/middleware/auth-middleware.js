import jwt from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        res.status(500).json({ message: "Server misconfiguration: JWT_SECRET not set." });
        return;
    }
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        res.status(401).json({ message: "Access Denied. No token provided." });
        return;
    }
    const token = authHeader.split(" ")[1] || authHeader;
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    }
    catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};
export const requireStudent = (req, res, next) => {
    if (req.user?.role !== "student") {
        res.status(403).json({ message: "Forbidden: student access only." });
        return;
    }
    next();
};
export const requireOrganiser = (req, res, next) => {
    if (req.user?.role !== "organiser") {
        res.status(403).json({ message: "Forbidden: organiser access only." });
        return;
    }
    next();
};
export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden: admin access only." });
        return;
    }
    next();
};
export const requireOrganiserOrAdmin = (req, res, next) => {
    if (req.user?.role !== "organiser" && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden: organiser or admin access required." });
        return;
    }
    next();
};
export const requireStudentOrAdmin = (req, res, next) => {
    if (req.user?.role !== "student" && req.user?.role !== "admin") {
        res.status(403).json({ message: "Forbidden: student or admin access required." });
        return;
    }
    next();
};
//# sourceMappingURL=auth-middleware.js.map