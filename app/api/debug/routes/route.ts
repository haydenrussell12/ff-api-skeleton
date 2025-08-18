import { NextResponse } from "next/server";

const routes = [
{ path: "/api/analyze-draft", methods: ["POST"] },
{ path: "/health", methods: ["GET"] },
{ path: "/api/debug/routes", methods: ["GET"] }
];

export function GET() {
return NextResponse.json({ routes });
}
