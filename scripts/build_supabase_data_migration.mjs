import mysql from "mysql2/promise";
import fs from "node:fs/promises";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const esc = value => `'${String(value ?? "").replaceAll("'", "''")}'`;
const nullable = value => value == null ? "NULL" : esc(value);
const bool = value => value ? "TRUE" : "FALSE";
const iso = value => value == null ? "NULL" : esc(new Date(value).toISOString());
const sqlDate = (value, fallbackTimestamp) => {
  if (value == null || value === "") return "NULL";
  const raw = String(value);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date(`${raw} ${new Date(fallbackTimestamp).getUTCFullYear()}`).toISOString().slice(0, 10);
  return esc(parsed);
};
const jsonb = value => {
  if (value == null || value === "") return "NULL";
  try { return `${esc(JSON.stringify(JSON.parse(value)))}::jsonb`; }
  catch { return `${esc(JSON.stringify({ raw: String(value) }))}::jsonb`; }
};
const [users] = await conn.query("SELECT id, openId, name, email, loginMethod, passwordHash, passwordSalt, role, createdAt, updatedAt, lastSignedIn FROM users ORDER BY id LIMIT 10000");
const [admins] = await conn.query("SELECT id, email, passwordHash, salt, createdAt FROM hicare_admin_accounts ORDER BY id LIMIT 100");
const [statuses] = await conn.query("SELECT conditionId, isActive, notice, openDate, updatedAt FROM hicare_condition_statuses ORDER BY conditionId LIMIT 100");
const [audits] = await conn.query("SELECT id, conditionId, adminEmail, action, isActive, notice, openDate, changedAt FROM hicare_condition_audits ORDER BY changedAt LIMIT 10000");
const [logs] = await conn.query("SELECT id, userId, eventType, conditionId, keywordId, metadata, createdAt FROM hicare_activity_logs ORDER BY id LIMIT 100000");
await conn.end();

const lines = [
  "begin;",
  ...users.map(u => `insert into public.users (id,open_id,name,email,login_method,password_hash,password_salt,role,created_at,updated_at,last_signed_in) values (${u.id},${esc(u.openId)},${nullable(u.name)},${nullable(u.email)},${nullable(u.loginMethod)},${nullable(u.passwordHash)},${nullable(u.passwordSalt)},${esc(u.role)},${iso(u.createdAt)},${iso(u.updatedAt)},${iso(u.lastSignedIn)}) on conflict (id) do update set open_id=excluded.open_id,name=excluded.name,email=excluded.email,login_method=excluded.login_method,password_hash=excluded.password_hash,password_salt=excluded.password_salt,role=excluded.role,created_at=excluded.created_at,updated_at=excluded.updated_at,last_signed_in=excluded.last_signed_in;`),
  ...admins.map(a => `insert into public.hicare_admin_accounts (id,email,password_hash,salt,created_at) values (${a.id},${esc(a.email)},${esc(a.passwordHash)},${esc(a.salt)},${iso(a.createdAt)}) on conflict (id) do update set email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,created_at=excluded.created_at;`),
  ...statuses.map(s => `insert into public.hicare_condition_statuses (condition_id,is_active,notice,open_date,updated_at) values (${esc(s.conditionId)},${bool(s.isActive)},${esc(s.notice ?? "")},${s.openDate ? esc(String(s.openDate).slice(0,10)) : "NULL"},${iso(s.updatedAt)}) on conflict (condition_id) do update set is_active=excluded.is_active,notice=excluded.notice,open_date=excluded.open_date,updated_at=excluded.updated_at;`),
  ...audits.map(a => `insert into public.hicare_condition_audits (id,condition_id,admin_email,action,is_active,notice,open_date,changed_at) values (${esc(a.id)}::uuid,${esc(a.conditionId)},${esc(a.adminEmail)},${esc(a.action)},${bool(a.isActive)},${esc(a.notice ?? "")},${sqlDate(a.openDate, a.changedAt)},${iso(a.changedAt)}) on conflict (id) do nothing;`),
  ...logs.map(l => `insert into public.hicare_activity_logs (id,user_id,event_type,condition_id,keyword_id,metadata,created_at) values (${l.id},${l.userId},${esc(l.eventType)},${nullable(l.conditionId)},${nullable(l.keywordId)},${jsonb(l.metadata)},${iso(l.createdAt)}) on conflict (id) do nothing;`),
  `select setval(pg_get_serial_sequence('public.users','id'), coalesce((select max(id) from public.users), 1), true);`,
  `select setval(pg_get_serial_sequence('public.hicare_activity_logs','id'), coalesce((select max(id) from public.hicare_activity_logs), 1), true);`,
  "commit;",
];
await fs.writeFile("/tmp/hicare_supabase_data_migration.sql", `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify({ users: users.length, admins: admins.length, statuses: statuses.length, audits: audits.length, logs: logs.length, path: "/tmp/hicare_supabase_data_migration.sql" }));
