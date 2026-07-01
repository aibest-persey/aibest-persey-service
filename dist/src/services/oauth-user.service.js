import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.model.js";
import OAuthAccount from "../models/OAuthAccount.model.js";
const USER_COLORS = [
    "#ff9800",
    "#4caf50",
    "#2196f3",
    "#9c27b0",
    "#f44336",
    "#3f51b5",
];
async function generateUniqueUsername(firstName, lastName) {
    const base = `${firstName ?? ""}${lastName ?? ""}`.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 14) || "user";
    for (let attempt = 0; attempt < 5; attempt++) {
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const candidate = `${base}${suffix}`;
        const existing = await User.findOne({ where: { username: candidate } });
        if (!existing)
            return candidate;
    }
    // Extremely unlikely fallback — guarantees termination with a near-certainly-unique suffix.
    return `${base}${crypto.randomBytes(4).toString("hex")}`;
}
// First-time OAuth login vs. returning login vs. linking to an existing password account —
// in that priority order — per the "linked by email/provider id" requirement.
export async function findOrCreateOAuthUser(provider, profile) {
    const existingAccount = await OAuthAccount.findOne({
        where: { provider, providerAccountId: profile.providerAccountId },
    });
    if (existingAccount) {
        if (existingAccount.email !== profile.email || existingAccount.emailVerified !== profile.emailVerified) {
            existingAccount.email = profile.email;
            existingAccount.emailVerified = profile.emailVerified;
            await existingAccount.save();
        }
        const user = await User.findByPk(existingAccount.userId);
        if (!user)
            throw new Error("Linked OAuth account has no matching user.");
        return user;
    }
    if (profile.emailVerified) {
        const matchingUser = await User.findOne({ where: { email: profile.email } });
        if (matchingUser) {
            await OAuthAccount.create({
                userId: matchingUser.id,
                provider,
                providerAccountId: profile.providerAccountId,
                email: profile.email,
                emailVerified: profile.emailVerified,
            });
            return matchingUser;
        }
    }
    const username = await generateUniqueUsername(profile.firstName, profile.lastName);
    const authString = bcrypt.hashSync(`${username}@${crypto.randomBytes(32).toString("hex")}`, 10);
    const newUser = await User.create({
        role: "student",
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        username,
        email: profile.email,
        password: null,
        authString,
        emailVerified: true,
        color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
    });
    await OAuthAccount.create({
        userId: newUser.id,
        provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email,
        emailVerified: profile.emailVerified,
    });
    return newUser;
}
//# sourceMappingURL=oauth-user.service.js.map