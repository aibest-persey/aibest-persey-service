import nodemailer from "nodemailer";

interface SendVerificationOptions {
  email: string;
  code: string;
}

interface SendResetOptions {
  email: string;
  resetUrl: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export const sendVerificationEmail = async ({ email, code }: SendVerificationOptions): Promise<void> => {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured; skipping verification email.");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@example.com",
    to: email,
    subject: "Verify your account",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  });
};

export const sendResetPasswordEmail = async ({ email, resetUrl }: SendResetOptions): Promise<void> => {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured; skipping reset password email.");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@example.com",
    to: email,
    subject: "Reset your password",
    text: `Use the link below to reset your password:\n\n${resetUrl}`,
    html: `<p>Use the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};
