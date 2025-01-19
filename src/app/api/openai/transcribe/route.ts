import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Transcription service is not available" },
    { status: 501 }
  );
}
