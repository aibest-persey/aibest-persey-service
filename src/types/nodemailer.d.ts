declare module "nodemailer" {
  import type * as SMTPTransport from "nodemailer/lib/smtp-transport";
  export * from "nodemailer/lib/mailer";
  const nodemailer: any;
  export default nodemailer;
}
