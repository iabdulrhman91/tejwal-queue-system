import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define sensitive paths:
  // 1. Exactly '/' (The Dashboard)
  // 2. Settings APIs - but only protect PATCH/POST/DELETE, allow GET for public display
  const isDashboard = pathname === "/";
  const isSettingsApi = pathname.startsWith("/api/settings");

  if (isDashboard) {
    const authCookie = request.cookies.get("auth_token")?.value;

    // Check if the cookie is 'valid_session_token'
    if (authCookie !== "valid_session_token") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // For settings API: only protect write operations (PATCH, POST, DELETE)
  if (isSettingsApi && (request.method === "PATCH" || request.method === "POST" || request.method === "DELETE")) {
    const authCookie = request.cookies.get("auth_token")?.value;

    // Check if the cookie is 'valid_session_token'
    if (authCookie !== "valid_session_token") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Ensure the middleware runs on these específico paths to improve performance
export const config = {
  matcher: ["/", "/api/settings/:path*"],
};
