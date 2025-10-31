import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const partialKey = process.env.OPENAI_API_KEY
    ? process.env.OPENAI_API_KEY.slice(0, 10) + "..."
    : null;

  return NextResponse.json({
    hasKey,
    partialKey,
  });
}
