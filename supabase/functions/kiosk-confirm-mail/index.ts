/**
 * Sends one kiosk confirm email with the project RESEND_API_KEY.
 * The kiosk Worker cannot read Supabase secrets, so it calls this with the
 * owner session. verify_jwt is on; app_role must be owner.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FROM = "Wolf Reminders <reminders@lbconsulting.tech>";

function appRole(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const padded = part.replaceAll("-", "+").replaceAll("_", "/") +
      "=".repeat((4 - (part.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { app_role?: unknown };
    return typeof payload.app_role === "string" ? payload.app_role : null;
  } catch {
    return null;
  }
}

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (appRole(req) !== "owner") return json(403, { error: "Forbidden" });

  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendKey) return json(503, { error: "Confirmation email is not configured" });

  let body: {
    to?: unknown;
    subject?: unknown;
    text?: unknown;
    html?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const text = typeof body.text === "string" ? body.text : "";
  const html = typeof body.html === "string" ? body.html : "";
  if (!to.includes("@") || subject.length === 0 || text.length === 0 || html.length === 0) {
    return json(400, { error: "Invalid email" });
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!resendRes.ok) return json(502, { error: "Could not send the confirmation email" });
  return json(200, { ok: true });
});
