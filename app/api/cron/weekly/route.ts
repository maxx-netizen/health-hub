import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { askGemini } from "@/lib/ai";
import { getDailyData, computeInsights, buildAIContext } from "@/lib/summary";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Draait elke maandag 07:00 UTC via Vercel Cron (zie vercel.json).
// Handmatig testen: GET /api/cron/weekly?key=CRON_SECRET
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { daily, workouts } = await getDailyData(14);
  if (Object.keys(daily).length === 0) {
    return NextResponse.json({ ok: false, reason: "geen data" });
  }
  const insights = computeInsights(daily);
  const context = buildAIContext(daily, workouts);

  const system =
    "Je schrijft een wekelijks gezondheidsrapport voor Max op basis van zijn echte data " +
    "(Amazfit Helio strap, Amazfit-weegschaal, LARQ-waterfles). Schrijf in het Nederlands. " +
    "Geef ALLEEN schone HTML (geen markdown, geen ```): gebruik <h2>, <p>, <ul>, <li>, <b>. " +
    "Structuur: korte samenvatting, daarna per thema (slaap & herstel, hart, activiteit, " +
    "gewicht & lichaamssamenstelling, hydratatie) de week vergeleken met de week ervoor, " +
    "en sluit af met 3 concrete actiepunten voor komende week. Gebruik echte cijfers uit de data.";

  const raw = await askGemini(system, [{
    role: "user",
    content: "Schrijf mijn weekrapport.\n\nVooraf berekende inzichten:\n" +
      insights.map((i) => `${i.emoji} ${i.text}`).join("\n") +
      "\n\nRuwe data:\n" + context,
  }]);
  const html = raw.replace(/```html?|```/g, "");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Health Hub <onboarding@resend.dev>",
    to: [process.env.EMAIL_TO ?? ""],
    subject: `🩺 Jouw weekrapport — ${datum}`,
    html:
      `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;color:#1a2233;line-height:1.6">` +
      `<h1 style="color:#0ea5e9">🩺 Health Hub — weekrapport</h1>${html}` +
      `<p style="color:#8b9bbd;font-size:12px;margin-top:32px">Automatisch gegenereerd door jouw Health Hub. Open het <a href="${process.env.APP_URL ?? "#"}">dashboard</a> voor live grafieken.</p></div>`,
  });

  if (error) return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  return NextResponse.json({ ok: true, sent: process.env.EMAIL_TO });
}
