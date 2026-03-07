import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define sensitive paths:
  // 1. Exactly '/' (The Dashboard)
  // 2. All settings APIs (/api/settings)
  const isDashboard = pathname === "/";
  const isSettingsApi = pathname.startsWith("/api/settings");
  
  if (isDashboard || isSettingsApi) {
    const authCookie = request.cookies.get("auth_token")?.value;
    
    // Check if the cookie is 'valid_session_token'
    if (authCookie !== "valid_session_token") {
      // If it's the dashboard UI, redirect to /login
      if (isDashboard) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      // If it's a settings API call, return 401 Unauthorized
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Ensure the middleware runs on these específico paths to improve performance
export const config = {
  matcher: ["/", "/api/settings/:path*"],
};
