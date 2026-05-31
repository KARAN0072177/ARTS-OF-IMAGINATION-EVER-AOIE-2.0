import { resend } from "./resend";

interface SendVerificationEmailParams {
  email: string;
  username: string;
  token: string;
}

export async function sendVerificationEmail({
  email,
  username,
  token,
}: SendVerificationEmailParams) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: "Verify your AOIE account",

    html: `
      <h2>Welcome to AOIE</h2>

      <p>Hello ${username},</p>

      <p>Click below to verify your account:</p>

      <a href="${verifyUrl}">
        Verify Account
      </a>

      <p>This link expires in 24 hours.</p>
    `,
  });
}