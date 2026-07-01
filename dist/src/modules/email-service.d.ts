interface SendVerificationOptions {
    email: string;
    code: string;
}
interface SendResetOptions {
    email: string;
    resetUrl: string;
}
export declare const sendVerificationEmail: ({ email, code }: SendVerificationOptions) => Promise<void>;
export declare const sendResetPasswordEmail: ({ email, resetUrl }: SendResetOptions) => Promise<void>;
export {};
//# sourceMappingURL=email-service.d.ts.map