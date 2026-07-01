import express from "express";
import rateLimit from "express-rate-limit";
import { initiate, callback } from "../controllers/oauth-controller.js";
const router = express.Router();
const oauthAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
});
const limiter = process.env.NODE_ENV === "test"
    ? (_req, _res, next) => next()
    : oauthAuthLimiter;
router.get("/:provider", limiter, initiate);
router.get("/:provider/callback", limiter, callback);
export default router;
//# sourceMappingURL=oauth-routes.js.map