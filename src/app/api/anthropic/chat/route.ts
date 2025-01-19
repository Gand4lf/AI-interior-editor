import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { error: "Chat service is not available" },
        { status: 501 }
    );
}
