import { NextResponse } from "next/server";

export function GET() {
	return NextResponse.json({ 
		data: [],
		message: "Leagues endpoint - functionality coming soon",
		status: "ok" 
	});
}

export function POST() {
	return NextResponse.json({ 
		message: "League creation - functionality coming soon",
		status: "ok" 
	});
} 