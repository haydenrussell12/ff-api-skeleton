import { NextResponse } from "next/server";

export function GET(
	request: Request,
	{ params }: { params: { slug: string[] } }
) {
	return NextResponse.json({ 
		message: `League endpoint ${params.slug.join('/')} - functionality coming soon`,
		status: "ok" 
	});
}

export function POST(
	request: Request,
	{ params }: { params: { slug: string[] } }
) {
	return NextResponse.json({ 
		message: `League endpoint ${params.slug.join('/')} - functionality coming soon`,
		status: "ok" 
	});
}

export function DELETE(
	request: Request,
	{ params }: { params: { slug: string[] } }
) {
	return NextResponse.json({ 
		message: `League endpoint ${params.slug.join('/')} - functionality coming soon`,
		status: "ok" 
	});
} 