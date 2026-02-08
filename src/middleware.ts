import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const path = request.nextUrl.pathname;

    // Protect /panel routes
    if (path.startsWith("/panel")) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
        const valid = await verifyToken(session);
        if (!valid) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    // Protect /admin if already logged in? (optional)
    if (path === "/admin" && session) {
        const valid = await verifyToken(session);
        if (valid) {
            return NextResponse.redirect(new URL("/panel", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/panel/:path*", "/admin"],
};
