import { resend } from "./resend";

interface SendVerificationEmailParams {
  email: string;
  username: string;
  token: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendVerificationEmail({
  email,
  username,
  token,
}: SendVerificationEmailParams) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`;
  const safeUsername = escapeHtml(username);
  const safeVerifyUrl = escapeHtml(verifyUrl);

  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: "Verify your AOIE account",

    html: `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Verify your AOIE account</title>
        </head>
        <body style="margin:0;background:#f7f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fb;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                  <tr>
                    <td style="background:#020617;padding:28px 32px;">
                      <p style="margin:0;color:#a5f3fc;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                        AOIE 2.0
                      </p>
                      <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;line-height:1.25;font-weight:700;">
                        Verify your email address
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:32px;">
                      <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
                        Hello <strong style="color:#0f172a;">${safeUsername}</strong>,
                      </p>

                      <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
                        Thanks for creating an AOIE account. Confirm this email address to finish setting up your profile and start exploring the gallery.
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                        <tr>
                          <td>
                            <a href="${safeVerifyUrl}" style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;border-radius:8px;padding:13px 20px;font-size:14px;font-weight:700;">
                              Verify email
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                        This verification link expires in 24 hours. If you did not create this account, you can safely ignore this email.
                      </p>

                      <div style="margin-top:24px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#334155;">
                          Button not working?
                        </p>
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">
                          ${safeVerifyUrl}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">
                  AOIE account verification
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
