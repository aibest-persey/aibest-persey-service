import { OAuth2Client } from "google-auth-library";
function getClient() {
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL);
}
const googleProvider = {
    id: "google",
    isConfigured() {
        return Boolean(process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            process.env.GOOGLE_CALLBACK_URL);
    },
    getAuthorizationUrl(state) {
        const client = getClient();
        return client.generateAuthUrl({
            access_type: "online",
            scope: ["openid", "email", "profile"],
            state,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        });
    },
    async handleCallback(code) {
        const client = getClient();
        const { tokens } = await client.getToken({
            code,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        });
        if (!tokens.id_token) {
            throw new Error("Google did not return an id_token.");
        }
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            throw new Error("Google id_token payload missing required fields.");
        }
        return {
            providerAccountId: payload.sub,
            email: payload.email,
            emailVerified: Boolean(payload.email_verified),
            firstName: payload.given_name ?? null,
            lastName: payload.family_name ?? null,
        };
    },
};
export default googleProvider;
//# sourceMappingURL=google.provider.js.map