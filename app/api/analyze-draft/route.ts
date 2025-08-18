import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json({ ok: true });
}

export function GET() {
	return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
} 