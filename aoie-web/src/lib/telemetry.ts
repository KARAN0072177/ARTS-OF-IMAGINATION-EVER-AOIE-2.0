import { connectDB } from "@/lib/db";
import PlatformLog from "@/models/PlatformLog";
import { emitAdminEvent } from "@/lib/emitAdminEvent";
import { sendEmergencySecurityAlertEmail } from "@/lib/sendEmergencySecurityAlertEmail";

export interface LogPlatformActivityParams {
  category: "SECURITY" | "MODERATION" | "AUTH" | "ADMIN_ACTION" | "INFRASTRUCTURE";
  severity: "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY";
  eventType: string;
  actor?: {
    userId?: any;
    username?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  details?: {
    route?: string;
    method?: string;
    attackVector?: string;
    payloadSnippet?: string;
    failureCount?: number;
    metadata?: Record<string, unknown>;
    changes?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };
  };
}

const failedAttemptsMap = new Map<string, number[]>();
const blockedIpsMap = new Map<string, number>();

export function isIpBlocked(ipAddress: string): boolean {
  if (!ipAddress || ipAddress === "unknown") return false;
  const unblockTime = blockedIpsMap.get(ipAddress);
  if (!unblockTime) return false;
  if (Date.now() > unblockTime) {
    blockedIpsMap.delete(ipAddress);
    return false;
  }
  return true;
}

export function blockIpFor30Mins(ipAddress: string): void {
  if (!ipAddress || ipAddress === "unknown") return;
  const lockDuration = 30 * 60 * 1000; // 30 minutes
  blockedIpsMap.set(ipAddress, Date.now() + lockDuration);
}

export function trackFailedLoginAttempt(identifier: string): { count: number; isBruteForce: boolean } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 60 seconds window
  const timestamps = (failedAttemptsMap.get(identifier) || []).filter((ts) => now - ts < windowMs);
  timestamps.push(now);
  failedAttemptsMap.set(identifier, timestamps);

  const count = timestamps.length;
  return {
    count,
    isBruteForce: count >= 10,
  };
}

export function extractClientIp(reqHeaders: any): { ipAddress: string; userAgent: string } {
  if (!reqHeaders) return { ipAddress: "127.0.0.1", userAgent: "unknown" };
  let ip = "";
  let ua = "";

  if (typeof reqHeaders.get === "function") {
    ip = reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || reqHeaders.get("x-real-ip") || "";
    ua = reqHeaders.get("user-agent") || "";
  } else if (typeof reqHeaders === "object") {
    ip = (reqHeaders["x-forwarded-for"] || reqHeaders["x-real-ip"] || "") as string;
    if (ip.includes(",")) ip = ip.split(",")[0].trim();
    ua = (reqHeaders["user-agent"] || "") as string;
  }

  return {
    ipAddress: ip || "127.0.0.1",
    userAgent: ua || "unknown",
  };
}

export async function logPlatformActivity({
  category,
  severity,
  eventType,
  actor = {},
  details = {},
}: LogPlatformActivityParams) {
  try {
    await connectDB();

    const log = await PlatformLog.create({
      category,
      severity,
      eventType,
      actor: {
        userId: actor.userId,
        username: actor.username || "",
        email: actor.email || "",
        ipAddress: actor.ipAddress && actor.ipAddress !== "unknown" ? actor.ipAddress : "127.0.0.1",
        userAgent: actor.userAgent || "unknown",
      },
      details: {
        route: details.route || "",
        method: details.method || "",
        attackVector: details.attackVector || "",
        payloadSnippet: details.payloadSnippet || "",
        failureCount: details.failureCount || 0,
        metadata: details.metadata || {},
        changes: details.changes || {},
      },
    });

    // Always emit real-time activity log update for live SOC dashboard
    emitAdminEvent({
      event: "platform_activity_logged",
      data: {
        logId: log._id,
        eventType,
        severity,
        category,
        actor: log.actor,
        details: log.details,
        createdAt: log.createdAt,
      },
    });

    // If High Severity Incident, trigger real-time socket broadcast & email dispatches
    if (severity === "CRITICAL" || severity === "EMERGENCY") {
      emitAdminEvent({
        event: "platform_security_incident",
        data: {
          logId: log._id,
          eventType,
          severity,
          category,
          ipAddress: actor.ipAddress,
          userEmail: actor.email,
          createdAt: log.createdAt,
        },
      });

      // Async dispatch email alert
      sendEmergencySecurityAlertEmail({
        eventType,
        severity,
        ipAddress: actor.ipAddress,
        userEmail: actor.email,
        route: details.route,
        attackVector: details.attackVector,
        detailsSnippet: details.payloadSnippet || JSON.stringify(details.metadata || {}),
      }).catch((err) => console.error("Telemetry Email Dispatch Error:", err));
    }

    return log;
  } catch (error) {
    console.error("Telemetry Error logging platform activity:", error);
  }
}
