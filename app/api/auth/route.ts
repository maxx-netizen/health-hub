import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("hub_auth", password, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
