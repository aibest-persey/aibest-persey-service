import googleProvider from "./google.provider.js";
import microsoftProvider from "./microsoft.provider.js";
import appleProvider from "./apple.provider.js";
const providers = {
    google: googleProvider,
    microsoft: microsoftProvider,
    apple: appleProvider,
};
export function getProvider(id) {
    return providers[id];
}
//# sourceMappingURL=registry.js.map