import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin123";

    if (password === DASHBOARD_PASSWORD) {
      // Create cookie: name='auth_token', value='valid', httpOnly, secure, Max-Age=3 months
      const response = NextResponse.json({ success: true });
      (await cookies()).set("auth_token", "valid_session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  (await cookies()).delete("auth_token");
  return NextResponse.json({ success: true });
}
