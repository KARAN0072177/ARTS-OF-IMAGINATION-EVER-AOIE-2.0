import { resend } from "@/lib/resend";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

interface SecurityAlertOptions {
  eventType: string;
  severity: "CRITICAL" | "EMERGENCY";
  ipAddress?: string;
  userEmail?: string;
  route?: string;
  attackVector?: string;
  detailsSnippet?: string;
}

let lastEmergencyEmailSentTime = 0;

export async function sendEmergencySecurityAlertEmail({
  eventType,
  severity,
  ipAddress = "127.0.0.1",
  userEmail = "N/A",
  route = "N/A",
  attackVector = "General Malicious Abuse",
  detailsSnippet = "Automatic telemetry triggered high-severity threat alert.",
}: SecurityAlertOptions) {
  const now = Date.now();
  const cooldownMs = 30 * 60 * 1000; // 30 minutes cooldown

  if (now - lastEmergencyEmailSentTime < cooldownMs) {
    console.log(`[Telemetry Email Cooldown] Skipping emergency email dispatch for ${eventType} (30-min cooldown active).`);
    return;
  }

  let adminEmails: string[] = [];
  try {
    await connectDB();
    const admins = await User.find({ role: { $in: ["admin", "super-admin"] } }).select("email").lean();
    adminEmails = admins.map((a) => a.email).filter(Boolean);
  } catch (dbErr) {
    console.error("Failed to fetch admin emails for alert:", dbErr);
  }

  if (process.env.ADMIN_EMAIL && !adminEmails.includes(process.env.ADMIN_EMAIL)) {
    adminEmails.push(process.env.ADMIN_EMAIL);
  }

  if (adminEmails.length === 0) {
    adminEmails = ["devilhuntercoc12@gmail.com"];
  }

  try {
    lastEmergencyEmailSentTime = now;
    await resend.emails.send({
      from: "AOIE Security <noreply@karanart.com>",
      to: adminEmails,
      subject: `🚨 [SECURITY ${severity}] Incident Alert: ${eventType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #dc2626;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
              <span style="background-color: #dc2626; color: #ffffff; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                ${severity} SECURITY THREAT
              </span>
            </div>

            <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 0;">
              Incident Triggered: ${eventType}
            </h1>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
              An automated high-severity security incident has been detected on the AOIE 2.0 platform.
            </p>

            <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
              <table style="width: 100%; text-align: left; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 130px;">Event Type:</td>
                  <td style="padding: 8px 0; color: #f8fafc; font-weight: bold;">${eventType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Attacker IP:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: font-mono;">${ipAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Target Account:</td>
                  <td style="padding: 8px 0; color: #38bdf8;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Target Route:</td>
                  <td style="padding: 8px 0; color: #f8fafc;">${route}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Vector:</td>
                  <td style="padding: 8px 0; color: #fbbf24;">${attackVector}</td>
                </tr>
              </table>

              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #1e293b;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Details / Payload Snippet:</p>
                <pre style="margin-top: 6px; background-color: #020617; color: #38bdf8; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${detailsSnippet}</pre>
              </div>
            </div>

            <p style="color: #94a3b8; font-size: 13px;">
              Please log in to the AOIE 2.0 Security Operations Center immediately to review and take enforcement action.
            </p>

            <div style="margin-top: 28px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/activity" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
                Open Security Operations Center
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send emergency security alert email:", error);
  }
}
