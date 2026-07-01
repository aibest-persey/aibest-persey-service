// TODO(fast-follow): implement with apple-signin-auth. Apple's "client secret" is not a
// static value — it's a short-lived ES256 JWT you mint yourself from APPLE_TEAM_ID +
// APPLE_KEY_ID + a .p8 private key downloaded once from the Apple Developer portal. This
// structural difference (vs. Google/Microsoft's static secret) is why Apple ships after
// Google/Microsoft. Same OAuthProvider shape as google.provider.ts.
const appleProvider = {
    id: "apple",
    isConfigured() {
        return Boolean(process.env.APPLE_CLIENT_ID &&
            process.env.APPLE_TEAM_ID &&
            process.env.APPLE_KEY_ID &&
            process.env.APPLE_PRIVATE_KEY);
    },
    getAuthorizationUrl() {
        throw new Error("Apple sign-in is not yet configured.");
    },
    async handleCallback() {
        throw new Error("Apple sign-in is not yet configured.");
    },
};
export default appleProvider;
//# sourceMappingURL=apple.provider.js.map