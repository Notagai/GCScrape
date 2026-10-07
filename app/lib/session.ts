import crypto from "node:crypto";
import { getAppEnv } from "./google";

const SESSION_COOKIE = "gcscrape_session";
const STATE_COOKIE = "gcscrape_oauth_state";

function secretKey() {
  const secret = getAppEnv().SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function createOAuthState() {
  return crypto.randomBytes(24).toString("hex");
}

export function encryptRefreshToken(refreshToken: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptRefreshToken(value: string) {
  const [ivText, tagText, encryptedText] = value.split(".");
  if (!ivText || !tagText || !encryptedText) throw new Error("Invalid session.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey(), iv && Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
}

export const sessionCookie = SESSION_COOKIE;
export const stateCookie = STATE_COOKIE;
