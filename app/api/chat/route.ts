import { NextRequest, NextResponse } from "next/server";
import { askGemini } from "@/lib/ai";
import { getDailyData, buildAIContext } from "@/lib/summary";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { messages } = await req.json(); // [{role, content}]
  const { daily, workouts } = await getDailyData(60);
  const context = buildAIContext(daily, workouts);

  const system =
    "Je bent de persoonlijke gezondheidscoach van Max. Hieronder staat zijn echte data " +
    "uit zijn Amazfit Helio strap, Amazfit-weegschaal en LARQ-waterfles (via Apple Health). " +
    "Antwoord in het Nederlands, concreet en met cijfers uit de data. Wijs op trends, verbanden " +
    "(bv. slaap vs. HRV, water vs. energie) en geef praktische adviezen. Wees eerlijk als data ontbreekt. " +
    "Je bent geen arts; verwijs bij medische zorgen naar een huisarts.\n\n=== DATA ===\n" + context;

  try {
    const reply = await askGemini(system, (messages ?? []).slice(-12));
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: "AI-fout: " + e.message }, { status: 500 });
  }
}
