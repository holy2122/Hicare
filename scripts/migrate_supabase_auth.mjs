import crypto from "node:crypto";
import fs from "node:fs/promises";

const base = process.env.SUPABASE_URL ?? "https://qgszvmlrqcafrgenusdj.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

async function api(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

const existing = [];
for (let page = 1; page <= 10; page++) {
  const batch = await api(`/auth/v1/admin/users?page=${page}&per_page=1000`);
  existing.push(...(batch.users ?? []));
  if (!batch.users || batch.users.length < 1000) break;
}

const members = [
  { id: 1, email: "200140@imcu.kr", name: "정인하", role: "admin" },
  { id: 30001, email: "inha3595@naver.com", name: "정인하", role: "user" },
  { id: 60001, email: "jongphil.park@ktservice.net", name: "박종필", role: "user" },
  { id: 60002, email: "shoutrock86@naver.com", name: "82175797", role: "user" },
];
const mapping = [];
for (const member of members) {
  let user = existing.find(item => item.email?.toLowerCase() === member.email.toLowerCase());
  if (!user) {
    user = await api("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: member.email,
        password: crypto.randomBytes(32).toString("base64url"),
        email_confirm: true,
        user_metadata: { name: member.name, migrated_from: "hicare_mysql", legacy_user_id: member.id, role: member.role, password_reset_required: true },
      }),
    });
  } else {
    user = await api(`/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify({ user_metadata: { ...(user.user_metadata ?? {}), name: member.name, migrated_from: "hicare_mysql", legacy_user_id: member.id, role: member.role, password_reset_required: true } }),
    });
  }
  mapping.push({ legacyId: member.id, email: member.email, authUserId: user.id });
}
await fs.writeFile("/tmp/hicare_supabase_auth_map.json", `${JSON.stringify(mapping, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ createdOrUpdated: mapping.length, mappingPath: "/tmp/hicare_supabase_auth_map.json", passwordResetRequired: true }));
