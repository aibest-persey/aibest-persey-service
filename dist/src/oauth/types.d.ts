export interface OAuthProfile {
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
    firstName?: string | null;
    lastName?: string | null;
}
export type OAuthProviderId = "google" | "microsoft" | "apple";
export interface OAuthProvider {
    id: OAuthProviderId;
    isConfigured(): boolean;
    getAuthorizationUrl(state: string): string;
    handleCallback(code: string): Promise<OAuthProfile>;
}
//# sourceMappingURL=types.d.ts.map