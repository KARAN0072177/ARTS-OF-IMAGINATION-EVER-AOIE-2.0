import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const PROMPT_VERSION = "v1.0.0";
export const AI_MODEL = "gpt-4o-mini";

// In-memory rate limiter: 20 requests per hour per admin user
const rateLimitStore = new Map<string, number[]>();
const MAX_REQUESTS_PER_HOUR = 20;
const ONE_HOUR_MS = 60 * 60 * 1000;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = rateLimitStore.get(userId) || [];
  
  // Filter out timestamps older than 1 hour
  const validTimestamps = timestamps.filter((t) => now - t < ONE_HOUR_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_HOUR) {
    rateLimitStore.set(userId, validTimestamps);
    return { allowed: false, remaining: 0 };
  }
  
  validTimestamps.push(now);
  rateLimitStore.set(userId, validTimestamps);
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - validTimestamps.length };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin =
      session.user.role === "admin" ||
      session.user.role === "super-admin";

    if (!isAdmin) {
      return Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { allowed, remaining } = checkRateLimit(session.user.id);
    if (!allowed) {
      return Response.json(
        {
          success: false,
          message: "Rate limit exceeded (20 AI enhancements per hour). Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const draftNote = typeof body.draftNote === "string" ? body.draftNote.trim() : "";
    const actionContext = typeof body.actionContext === "string" ? body.actionContext : "general";

    if (!draftNote) {
      return Response.json(
        { success: false, message: "Please provide a draft note to enhance." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, message: "OpenAI API key is missing on server." },
        { status: 500 }
      );
    }

    const systemInstruction = `You are an expert SaaS communications assistant for "Arts of Imagination Ever" (AOIE 2.0).
Your task is to refine and rewrite informal admin review notes into concise, professional, constructive, and polite decision messages for artist applicants.
Guidelines:
- Maintain the original intent and key feedback/reasons from the admin's draft.
- Use a clear, encouraging, and professional tone suitable for notification emails and official audit logs.
- Keep the response direct and concise (under 80 words). Do not add bullet points unless requested.
- Context of action: ${actionContext.toUpperCase()}.`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Transform this draft admin note:\n"${draftNote}"` },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const aiData = await openAiResponse.json();

    if (!openAiResponse.ok || !aiData.choices?.[0]?.message?.content) {
      console.error("OpenAI Error:", aiData);
      return Response.json(
        {
          success: false,
          message: aiData.error?.message || "Failed to generate AI note enhancement.",
        },
        { status: 502 }
      );
    }

    const enhancedNote = aiData.choices[0].message.content.trim().replace(/^["']|["']$/g, "");

    return Response.json({
      success: true,
      enhancedNote,
      aiModel: AI_MODEL,
      promptVersion: PROMPT_VERSION,
      remainingRequests: remaining,
    });
  } catch (error) {
    console.error("AI Enhance Endpoint Error:", error);
    return Response.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
