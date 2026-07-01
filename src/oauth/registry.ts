import { OAuthProvider, OAuthProviderId } from "./types.js";
import googleProvider from "./google.provider.js";
import microsoftProvider from "./microsoft.provider.js";
import appleProvider from "./apple.provider.js";

const providers: Record<OAuthProviderId, OAuthProvider> = {
  google: googleProvider,
  microsoft: microsoftProvider,
  apple: appleProvider,
};

export function getProvider(id: string): OAuthProvider | undefined {
  return providers[id as OAuthProviderId];
}
