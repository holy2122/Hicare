import type { Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { getSupabaseAuthUser, getSupabaseUserByAuthId, supabaseRequest } from "../supabaseClient";
import type { User } from "../../drizzle/schema";

export const LOCAL_SESSION_COOKIE = "hicare_supabase_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
type SessionTokens = { accessToken: string; refreshToken?: string };
function appUser(user: Awaited<ReturnType<typeof getSupabaseUserByAuthId>>): User | null {
  if (!user) return null;
  return { id: user.id, openId: user.open_id, name: user.name, email: user.email, loginMethod: user.login_method, passwordHash: user.password_hash, passwordSalt: user.password_salt, role: user.role, createdAt: new Date(user.created_at), updatedAt: new Date(user.updated_at), lastSignedIn: new Date(user.last_signed_in) };
}

function readCookie(req: Request) {
  return (req.headers.cookie ?? "").split(";").map(part => part.trim()).find(part => part.startsWith(`${LOCAL_SESSION_COOKIE}=`))?.slice(LOCAL_SESSION_COOKIE.length + 1) ?? "";
}
function decodeSession(raw: string): SessionTokens | null { try { const parsed = JSON.parse(Buffer.from(decodeURIComponent(raw), "base64url").toString("utf8")); return typeof parsed.accessToken === "string" ? parsed : null; } catch { return null; } }
function encodeSession(tokens: SessionTokens) { return encodeURIComponent(Buffer.from(JSON.stringify(tokens), "utf8").toString("base64url")); }
function setCookie(res: Response, req: Request, tokens: SessionTokens) { res.cookie(LOCAL_SESSION_COOKIE, encodeSession(tokens), { ...getSessionCookieOptions(req), httpOnly: true, maxAge: SESSION_MAX_AGE_SECONDS * 1000 }); }

export async function getLocalUser(req: Request, res?: Response) {
  const tokens = decodeSession(readCookie(req));
  if (!tokens) return null;
  try {
    const authUser = await getSupabaseAuthUser(tokens.accessToken);
    return appUser(await getSupabaseUserByAuthId(authUser.id));
  } catch {
    if (!tokens.refreshToken || !res) return null;
    try {
      const refreshed = await supabaseRequest<{ access_token: string; refresh_token?: string }>("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: tokens.refreshToken }) });
      setCookie(res, req, { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token ?? tokens.refreshToken });
      const authUser = await getSupabaseAuthUser(refreshed.access_token);
      return appUser(await getSupabaseUserByAuthId(authUser.id));
    } catch { return null; }
  }
}

export function setLocalSession(res: Response, req: Request, tokens: SessionTokens) { setCookie(res, req, tokens); }
export function clearLocalSession(res: Response, req: Request) { res.clearCookie(LOCAL_SESSION_COOKIE, { ...getSessionCookieOptions(req), httpOnly: true, maxAge: -1 }); }
