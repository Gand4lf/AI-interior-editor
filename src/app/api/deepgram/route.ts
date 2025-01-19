import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json(
        { error: "Speech-to-text service is not available" },
        { status: 501 }
    );
}
