import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly"
  ];

  const url = client.generateAuthUrl({
    access_type:"offline",
    scope:scopes,
    prompt:"consent"
  });

  return NextResponse.redirect(url);
}
