import User from "../models/User.model.js";
import { OAuthProfile, OAuthProviderId } from "../oauth/types.js";
export declare function findOrCreateOAuthUser(provider: OAuthProviderId, profile: OAuthProfile): Promise<User>;
//# sourceMappingURL=oauth-user.service.d.ts.map