import { NextResponse } from "next/server";

export function POST() {
	return NextResponse.json({ 
		message: "AI helper endpoint - functionality coming soon",
		status: "ok" 
	});
} 