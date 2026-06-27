import { resend } from "./resend";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailShell({
  title,
  body,
  footer,
}: {
  title: string;
  body: string;
  footer: string;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;background:#f7f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="background:#020617;padding:28px 32px;">
                    <p style="margin:0;color:#a5f3fc;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                      AOIE moderation
                    </p>
                    <h1 style="margin:12px 0 0;color:#ffffff;font-size:26px;line-height:1.25;font-weight:700;">
                      ${escapeHtml(title)}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${body}
                  </td>
                </tr>
              </table>
              <p style="margin:18px 0 0;font-size:12px;color:#94a3b8;">
                ${escapeHtml(footer)}
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendReportDecisionEmail({
  email,
  username,
  artworkTitle,
  status,
  adminNote,
}: {
  email: string;
  username: string;
  artworkTitle: string;
  status: "valid" | "invalid";
  adminNote: string;
}) {
  const valid = status === "valid";

  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: valid
      ? "Your AOIE report was accepted"
      : "Your AOIE report was reviewed",
    html: emailShell({
      title: valid
        ? "Report accepted"
        : "Report reviewed",
      footer: "AOIE report review",
      body: `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
          Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
          We reviewed your report for <strong style="color:#0f172a;">${escapeHtml(artworkTitle)}</strong>.
        </p>
        <div style="margin:24px 0;padding:18px;border:1px solid ${valid ? "#bbf7d0" : "#e2e8f0"};border-radius:12px;background:${valid ? "#f0fdf4" : "#f8fafc"};">
          <p style="margin:0;font-size:18px;font-weight:800;color:${valid ? "#047857" : "#334155"};">
            ${valid ? "The report was marked valid." : "The report was marked invalid."}
          </p>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">
            ${escapeHtml(adminNote || "No additional note was provided.")}
          </p>
        </div>
      `,
    }),
  });
}

export async function sendArtistWarningEmail({
  email,
  username,
  artworkTitle,
  adminNote,
}: {
  email: string;
  username: string;
  artworkTitle: string;
  adminNote: string;
}) {
  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: "AOIE removed one of your artworks",
    html: emailShell({
      title: "Artwork removed",
      footer: "AOIE moderation warning",
      body: `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
          Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
          An AOIE admin reviewed a report and removed <strong style="color:#0f172a;">${escapeHtml(artworkTitle)}</strong> from the website.
        </p>
        <div style="margin:24px 0;padding:18px;border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#be123c;">
            Admin note
          </p>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">
            ${escapeHtml(adminNote || "The artwork was found to violate AOIE rules.")}
          </p>
        </div>
      `,
    }),
  });
}

export async function sendModerationWarningEmail({
  email,
  username,
  category,
  strikeCount,
  adminNote,
}: {
  email: string;
  username: string;
  category: string;
  strikeCount: number;
  adminNote?: string;
}) {
  await resend.emails.send({
    from: "AOIE Moderation <noreply@karanart.com>",
    to: email,
    subject: `[AOIE Policy Warning] Content violation detected (Strike ${strikeCount})`,
    html: emailShell({
      title: "Content Policy Warning",
      footer: "AOIE Trust & Safety Team",
      body: `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
          Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
          An automated moderation scan flagged a recent upload attempt associated with your account for violating our content guidelines regarding <strong style="color:#e11d48;">${escapeHtml(category)}</strong>.
        </p>
        <div style="margin:24px 0;padding:18px;border:1px solid #fde68a;border-radius:12px;background:#fffbeb;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#b45309;">
            Account Status: Strike ${strikeCount} Issued
          </p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#78350f;">
            Please review our platform guidelines to ensure all future uploads remain compliant. Repeat violations may lead to temporary or permanent account suspension.
          </p>
          ${
            adminNote
              ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#92400e;"><strong>Admin Note:</strong> ${escapeHtml(adminNote)}</p>`
              : ""
          }
        </div>
        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
          If you believe your content was flagged in error, please reply to this email or contact support for a manual appeal review.
        </p>
      `,
    }),
  });
}

export async function sendModerationSuspensionEmail({
  email,
  username,
  category,
  adminNote,
}: {
  email: string;
  username: string;
  category: string;
  adminNote?: string;
}) {
  await resend.emails.send({
    from: "AOIE Moderation <noreply@karanart.com>",
    to: email,
    subject: "[AOIE] Account Suspended due to Content Policy Violations",
    html: emailShell({
      title: "Account Suspended",
      footer: "AOIE Trust & Safety Enforcement",
      body: `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
          Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
        </p>
        <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
          Your AOIE account has been suspended following repeated content policy violations involving <strong style="color:#be123c;">${escapeHtml(category)}</strong>.
        </p>
        <div style="margin:24px 0;padding:18px;border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#be123c;">
            Enforcement Action: Account Access Suspended
          </p>
          ${
            adminNote
              ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#9f1239;"><strong>Enforcement Reason:</strong> ${escapeHtml(adminNote)}</p>`
              : ""
          }
        </div>
      `,
    }),
  });
}
