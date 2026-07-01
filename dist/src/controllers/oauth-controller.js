import crypto from "crypto";
import jwt from "jsonwebtoken";
import redis from "../clients/redis-client.js";
import { getProvider } from "../oauth/registry.js";
import { findOrCreateOAuthUser } from "../services/oauth-user.service.js";
const STATE_TTL_SECONDS = 600;
function frontendUrl(pathname, params = {}) {
    const base = process.env.FRONTEND_URL || "http://localhost:5173";
    const query = new URLSearchParams(params).toString();
    return `${base}${pathname}${query ? `?${query}` : ""}`;
}
export const initiate = async (req, res) => {
    const { provider: providerId } = req.params;
    const provider = getProvider(providerId);
    if (!provider) {
        res.status(404).json({ message: "Unknown OAuth provider." });
        return;
    }
    if (!provider.isConfigured()) {
        res.redirect(frontendUrl("/sign-in", { oauthError: "not_configured", provider: providerId }));
        return;
    }
    try {
        const state = crypto.randomBytes(16).toString("hex");
        await redis.set(`oauthState:${state}`, providerId, { ex: STATE_TTL_SECONDS });
        res.redirect(provider.getAuthorizationUrl(state));
    }
    catch (error) {
        console.error("OAuth Initiate Error:", error);
        res.redirect(frontendUrl("/sign-in", { oauthError: "oauth_failed" }));
    }
};
export const callback = async (req, res) => {
    const { provider: providerId } = req.params;
    const provider = getProvider(providerId);
    if (!provider) {
        res.status(404).json({ message: "Unknown OAuth provider." });
        return;
    }
    const { code, state, error } = req.query;
    if (error) {
        res.redirect(frontendUrl("/sign-in", { oauthError: "access_denied" }));
        return;
    }
    if (!state) {
        res.redirect(frontendUrl("/sign-in", { oauthError: "invalid_state" }));
        return;
    }
    const storedProvider = await redis.get(`oauthState:${state}`);
    await redis.del(`oauthState:${state}`); // one-time use regardless of outcome
    if (!storedProvider || storedProvider !== providerId) {
        res.redirect(frontendUrl("/sign-in", { oauthError: "invalid_state" }));
        return;
    }
    if (!code) {
        res.redirect(frontendUrl("/sign-in", { oauthError: "oauth_failed" }));
        return;
    }
    try {
        const profile = await provider.handleCallback(code);
        const user = await findOrCreateOAuthUser(providerId, profile);
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, {
            expiresIn: "24h",
        });
        try {
            const publicUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                color: user.color,
                authString: user.authString,
            };
            await redis.set(`user:${publicUser.authString}`, JSON.stringify(publicUser), { ex: 3600 });
            await redis.set(`userId:${publicUser.id}`, JSON.stringify(publicUser), { ex: 3600 });
        }
        catch (e) {
            console.warn("Failed to set user cache on OAuth login", e);
        }
        res.redirect(`${frontendUrl("/oauth-callback")}#token=${token}`);
    }
    catch (error) {
        console.error("OAuth Callback Error:", error);
        res.redirect(frontendUrl("/sign-in", { oauthError: "oauth_failed" }));
    }
};
//# sourceMappingURL=oauth-controller.js.map