import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { candidates, action, customMessage, companyName, senderEmail } = await req.json();
    // candidates: { id, name, email, totalScore, assessmentName }[]
    // action: "shortlisted" | "rejected"

    if (!candidates?.length || !action) {
      return new Response(JSON.stringify({ error: "Missing candidates or action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const candidate of candidates) {
      const subject = action === "shortlisted"
        ? `Congratulations! You've been shortlisted — ${companyName || "Hiring Team"}`
        : `Update on your application — ${companyName || "Hiring Team"}`;

      const htmlBody = buildEmailHtml(candidate, action, customMessage, companyName);

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: senderEmail || "onboarding@resend.dev",
            to: [candidate.email],
            subject,
            html: htmlBody,
          }),
        });

        const resData = await res.json();
        if (!res.ok) {
          console.error(`Failed to send to ${candidate.email}:`, resData);
          results.push({ email: candidate.email, success: false, error: resData?.message || "Send failed" });
        } else {
          results.push({ email: candidate.email, success: true });
        }
      } catch (err) {
        console.error(`Error sending to ${candidate.email}:`, err);
        results.push({ email: candidate.email, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(JSON.stringify({ results, successCount, totalCount: candidates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-candidate-emails error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildEmailHtml(
  candidate: { name: string; totalScore: number; assessmentName: string },
  action: "shortlisted" | "rejected",
  customMessage: string | null,
  companyName: string | null
): string {
  const company = companyName || "Hiring Team";
  const isShortlisted = action === "shortlisted";

  const accentColor = isShortlisted ? "#22c55e" : "#6b7280";
  const statusText = isShortlisted ? "Shortlisted" : "Not Selected";
  const emoji = isShortlisted ? "🎉" : "📋";

  const defaultMessage = isShortlisted
    ? `We are pleased to inform you that after reviewing your assessment results, you have been shortlisted for the next stage of our hiring process. We were impressed by your performance and look forward to connecting with you soon.`
    : `Thank you for taking the time to complete our assessment. After careful consideration, we have decided to move forward with other candidates at this time. We appreciate your effort and encourage you to apply for future opportunities with us.`;

  const message = customMessage?.trim() || defaultMessage;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:${accentColor};padding:24px 32px;text-align:center;">
          <span style="font-size:28px;">${emoji}</span>
          <h1 style="color:#ffffff;font-size:20px;margin:8px 0 0;font-weight:600;">${statusText}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#18181b;font-size:15px;margin:0 0 6px;">Hi <strong>${candidate.name}</strong>,</p>
          <p style="color:#52525b;font-size:14px;line-height:1.6;margin:16px 0;">${message}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin:20px 0;">
            <tr><td style="padding:16px;">
              <p style="color:#71717a;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Assessment</p>
              <p style="color:#18181b;font-size:14px;margin:0;font-weight:500;">${candidate.assessmentName}</p>
            </td>
            <td style="padding:16px;text-align:right;">
              <p style="color:#71717a;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Score</p>
              <p style="color:${accentColor};font-size:18px;margin:0;font-weight:700;">${candidate.totalScore}%</p>
            </td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
          <p style="color:#a1a1aa;font-size:12px;text-align:center;margin:0;">Best regards,<br><strong style="color:#52525b;">${company}</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
