import { resend } from "./resend";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:13px;width:130px;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:700;vertical-align:top;">
        ${escapeHtml(value || "Not provided")}
      </td>
    </tr>
  `;
}

function baseEmail({
  title,
  eyebrow,
  body,
  footer,
}: {
  title: string;
  eyebrow: string;
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
                      ${escapeHtml(eyebrow)}
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

export async function sendArtistApplicationReceivedEmail({
  email,
  username,
  displayName,
  bio,
  location,
  website,
  categories,
}: {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  categories: string[];
}) {
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
      Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
    </p>

    <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
      We received your AOIE artist application. Your account will stay as a regular user while an admin reviews the details.
    </p>

    <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#334155;">
        Application summary
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${detailRow("Display name", displayName)}
        ${detailRow("Categories", categories.join(", "))}
        ${detailRow("Location", location)}
        ${detailRow("Portfolio", website)}
        ${detailRow("Bio", bio)}
      </table>
    </div>

    <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
      Sample images were uploaded for admin review and are intentionally not included in this email.
    </p>
  `;

  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: "We received your AOIE artist application",
    html: baseEmail({
      eyebrow: "AOIE artist review",
      title: "Application received",
      body,
      footer: "AOIE artist application",
    }),
  });
}

export async function sendArtistApplicationDecisionEmail({
  email,
  username,
  displayName,
  status,
  adminNote,
}: {
  email: string;
  username: string;
  displayName: string;
  status: "approved" | "rejected";
  adminNote: string;
}) {
  const approved = status === "approved";
  const body = `
    <p style="margin:0;font-size:16px;line-height:1.6;color:#334155;">
      Hello <strong style="color:#0f172a;">${escapeHtml(username)}</strong>,
    </p>

    <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#475569;">
      Your AOIE artist application for <strong style="color:#0f172a;">${escapeHtml(displayName)}</strong> has been <strong style="color:#0f172a;">${approved ? "approved" : "reviewed"}</strong>.
    </p>

    <div style="margin:24px 0;padding:18px;border:1px solid ${approved ? "#bbf7d0" : "#fecdd3"};border-radius:12px;background:${approved ? "#f0fdf4" : "#fff1f2"};">
      <p style="margin:0;font-size:18px;font-weight:800;color:${approved ? "#047857" : "#be123c"};">
        ${approved ? "Artist account approved" : "Application rejected"}
      </p>
      <p style="margin:10px 0 0;font-size:14px;line-height:1.7;color:#475569;">
        ${approved ? "You can now upload artwork and manage your public artist profile." : "You can update your details and submit again when ready."}
      </p>
    </div>

    <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#334155;">
        Admin note
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
        ${escapeHtml(adminNote || (approved ? "Approved by AOIE admin." : "No reason provided."))}
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "AOIE <noreply@karanart.com>",
    to: email,
    subject: approved
      ? "Your AOIE artist application was approved"
      : "Your AOIE artist application was reviewed",
    html: baseEmail({
      eyebrow: "AOIE artist review",
      title: approved
        ? "Artist account approved"
        : "Application reviewed",
      body,
      footer: "AOIE artist application decision",
    }),
  });
}
