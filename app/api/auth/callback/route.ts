import { NextResponse } from "next/server";
import { createOAuthClient } from "@/app/lib/google";
import { encryptRefreshToken, sessionCookie, stateCookie } from "@/app/lib/session";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(stateCookie)?.value;

  if (!code) return NextResponse.json({ error: "Missing OAuth code" }, { status: 400 });
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const { tokens } = await createOAuthClient().getToken(code);
    if (!tokens.refresh_token) return NextResponse.json({ error: "Google did not return a refresh token. Try connecting again." }, { status: 400 });

    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(sessionCookie, encryptRefreshToken(tokens.refresh_token), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30
    });
    response.cookies.set(stateCookie, "", {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OAuth error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
