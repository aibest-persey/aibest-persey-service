import { OAuthProfile, OAuthProvider } from "./types.js";

// TODO(fast-follow): implement with @azure/msal-node once MICROSOFT_CLIENT_ID/SECRET/TENANT_ID
// are registered in the Azure AD app portal. Same OAuthProvider shape as google.provider.ts.
const microsoftProvider: OAuthProvider = {
  id: "microsoft",

  isConfigured(): boolean {
    return Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  },

  getAuthorizationUrl(): string {
    throw new Error("Microsoft sign-in is not yet configured.");
  },

  async handleCallback(): Promise<OAuthProfile> {
    throw new Error("Microsoft sign-in is not yet configured.");
  },
};

export default microsoftProvider;
