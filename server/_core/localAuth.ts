import { createHmac, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { getUserById } from "../db";

export const LOCAL_SESSION_COOKIE = "hicare_user_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = ENV.cookieSecret || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("JWT_SECRET is required for local user sessions");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createLocalSession(userId: number) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const body = Buffer.from(JSON.stringify({ userId, expires }), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function readCookie(req: Request) {
  return (req.headers.cookie ?? "")
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${LOCAL_SESSION_COOKIE}=`))
    ?.slice(LOCAL_SESSION_COOKIE.length + 1) ?? "";
}

export async function getLocalUser(req: Request) {
  const [body, signature] = readCookie(req).split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { userId: number; expires: number };
    if (!Number.isInteger(payload.userId) || payload.expires <= Math.floor(Date.now() / 1000)) return null;
    return (await getUserById(payload.userId)) ?? null;
  } catch {
    return null;
  }
}

export function setLocalSession(res: Response, req: Request, userId: number) {
  res.cookie(LOCAL_SESSION_COOKIE, createLocalSession(userId), {
    ...getSessionCookieOptions(req),
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export function clearLocalSession(res: Response, req: Request) {
  res.clearCookie(LOCAL_SESSION_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}
