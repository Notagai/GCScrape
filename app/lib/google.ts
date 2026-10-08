import { env as cloudflareEnv } from "cloudflare:workers";
import { google } from "googleapis";

export const classroomScopes = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly"
];

type AppEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  SESSION_SECRET?: string;
};

export function getAppEnv(): AppEnv {
  const runtime = cloudflareEnv as unknown as AppEnv;
  return {
    GOOGLE_CLIENT_ID: runtime.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: runtime.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: runtime.GOOGLE_REDIRECT_URI ?? process.env.GOOGLE_REDIRECT_URI,
    SESSION_SECRET: runtime.SESSION_SECRET ?? process.env.SESSION_SECRET
  };
}

function required(name: keyof AppEnv) {
  const value = getAppEnv()[name];
  if (!value) throw new Error(`Missing required environment setting: ${name}`);
  return value;
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    required("GOOGLE_CLIENT_ID"),
    required("GOOGLE_CLIENT_SECRET"),
    required("GOOGLE_REDIRECT_URI")
  );
}

export function createClassroomClient(refreshToken: string) {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return google.classroom({ version: "v1", auth: client });
}
