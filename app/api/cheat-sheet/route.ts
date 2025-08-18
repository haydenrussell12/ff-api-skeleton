import { NextResponse } from "next/server";

export function GET() {
	return NextResponse.json({ 
		message: "Cheat sheet endpoint - functionality coming soon",
		status: "ok" 
	});
} 