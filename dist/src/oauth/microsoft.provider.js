// TODO(fast-follow): implement with @azure/msal-node once MICROSOFT_CLIENT_ID/SECRET/TENANT_ID
// are registered in the Azure AD app portal. Same OAuthProvider shape as google.provider.ts.
const microsoftProvider = {
    id: "microsoft",
    isConfigured() {
        return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
    },
    getAuthorizationUrl() {
        throw new Error("Microsoft sign-in is not yet configured.");
    },
    async handleCallback() {
        throw new Error("Microsoft sign-in is not yet configured.");
    },
};
export default microsoftProvider;
//# sourceMappingURL=microsoft.provider.js.map