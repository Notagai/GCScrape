import { NextResponse } from "next/server";
import { createOAuthClient, classroomScopes } from "@/app/lib/google";
import { createOAuthState, stateCookie } from "@/app/lib/session";

export async function GET() {
  const client = createOAuthClient();
  const state = createOAuthState();
  const url = client.generateAuthUrl({ access_type: "offline", scope: classroomScopes, prompt: "consent", state });
  const response = NextResponse.redirect(url);
  response.cookies.set(stateCookie, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return response;
}
