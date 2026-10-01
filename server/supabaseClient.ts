import { randomBytes } from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? "https://qgszvmlrqcafrgenusdj.supabase.co").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type SupabaseAuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
export type SupabaseUser = { id: number; open_id: string; auth_user_id: string | null; name: string | null; email: string | null; login_method: string | null; password_hash: string | null; password_salt: string | null; role: "user" | "admin"; created_at: string; updated_at: string; last_signed_in: string };

function ensureConfigured() { if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured"); }
function headers(extra: Record<string, string> = {}) { ensureConfigured(); return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra }; }

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const message = typeof body === "object" && body ? ((body as { msg?: string; message?: string; error_description?: string }).msg ?? (body as { message?: string }).message ?? (body as { error_description?: string }).error_description) : String(body);
    throw new Error(message || `Supabase request failed (${response.status})`);
  }
  return body as T;
}

export async function getSupabaseUserByAuthId(authUserId: string) { const rows = await supabaseRequest<SupabaseUser[]>(`/rest/v1/users?auth_user_id=eq.${encodeURIComponent(authUserId)}&select=*&limit=1`); return rows[0] ?? null; }
export async function getSupabaseUserByEmail(email: string) { const rows = await supabaseRequest<SupabaseUser[]>(`/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=*&limit=1`); return rows[0] ?? null; }
export async function getSupabaseUserById(id: number) { const rows = await supabaseRequest<SupabaseUser[]>(`/rest/v1/users?id=eq.${id}&select=*&limit=1`); return rows[0] ?? null; }

export async function createSupabaseMember(input: { authUserId: string; name: string; email: string }) {
  const rows = await supabaseRequest<SupabaseUser[]>("/rest/v1/users", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ open_id: `supabase_${input.authUserId}`, auth_user_id: input.authUserId, name: input.name, email: input.email.toLowerCase(), login_method: "supabase", role: "user" }) });
  return rows[0] ?? null;
}
export async function updateSupabaseLastSignedIn(id: number) { await supabaseRequest(`/rest/v1/users?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ last_signed_in: new Date().toISOString() }) }); }
export async function linkAuthUser(id: number, authUserId: string) { await supabaseRequest(`/rest/v1/users?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ auth_user_id: authUserId }) }); }

export async function createSupabaseAuthUser(input: { email: string; password: string; name: string }) {
  return supabaseRequest<SupabaseAuthUser>("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email: input.email.toLowerCase(), password: input.password, email_confirm: true, user_metadata: { name: input.name } }) });
}
export async function updateSupabaseAuthPassword(authUserId: string, password: string) { await supabaseRequest(`/auth/v1/admin/users/${authUserId}`, { method: "PUT", body: JSON.stringify({ password }) }); }
export async function signInSupabaseAuth(email: string, password: string) { return supabaseRequest<{ access_token: string; refresh_token: string; expires_in: number; user: SupabaseAuthUser }>(`/auth/v1/token?grant_type=password`, { method: "POST", body: JSON.stringify({ email: email.toLowerCase(), password }) }); }
export async function requestSupabasePasswordReset(email: string) { await supabaseRequest("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email: email.toLowerCase() }) }); }
export async function getSupabaseAuthUser(accessToken: string) { return supabaseRequest<SupabaseAuthUser>("/auth/v1/user", { headers: { Authorization: `Bearer ${accessToken}` } }); }
export function randomTemporaryPassword() { return randomBytes(32).toString("base64url"); }

export async function insertSupabaseActivity(log: { user_id: number; event_type: string; condition_id?: string; keyword_id?: string; metadata?: Record<string, string> }) {
  const rows = await supabaseRequest<unknown[]>("/rest/v1/hicare_activity_logs", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...log, metadata: log.metadata ?? null }) });
  return rows[0];
}
export async function listSupabaseMembers() { const rows = await supabaseRequest<SupabaseUser[]>("/rest/v1/users?select=id,open_id,name,email,role,created_at,last_signed_in&order=created_at.desc&limit=10000"); return rows.map(row => ({ id: row.id, openId: row.open_id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at, lastSignedIn: row.last_signed_in })); }
export async function listSupabaseActivityLogs(limit = 500) { const rows = await supabaseRequest<Array<Record<string, unknown>>>(`/rest/v1/hicare_activity_report?select=*&order=created_at.desc&limit=${Math.min(limit, 100000)}`); return rows.map(row => ({ id: row.id, userId: row.user_id, eventType: row.event_type, conditionId: row.condition_id, keywordId: row.keyword_id, metadata: row.metadata, createdAt: row.created_at, email: row.email, name: row.name })); }
export async function listSupabaseStatuses() { return supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/hicare_condition_statuses?select=condition_id,is_active,notice,open_date,updated_at&limit=100"); }
export async function upsertSupabaseStatus(value: { conditionId: string; isActive: boolean; notice: string; openDate: string | null; updatedAt?: string }) { await supabaseRequest("/rest/v1/hicare_condition_statuses?on_conflict=condition_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ condition_id: value.conditionId, is_active: value.isActive, notice: value.notice, open_date: value.openDate, updated_at: value.updatedAt ?? new Date().toISOString() }) }); }
export async function insertSupabaseAudit(value: { id: string; conditionId: string; adminEmail: string; action: string; isActive: boolean; notice: string; openDate: string | null; changedAt: string }) { await supabaseRequest("/rest/v1/hicare_condition_audits", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ id: value.id, condition_id: value.conditionId, admin_email: value.adminEmail, action: value.action, is_active: value.isActive, notice: value.notice, open_date: value.openDate, changed_at: value.changedAt }) }); }
export async function listSupabaseAudits() { return supabaseRequest<Array<Record<string, unknown>>>("/rest/v1/hicare_condition_audits?select=id,condition_id,admin_email,action,is_active,notice,open_date,changed_at&order=changed_at.desc&limit=200"); }
