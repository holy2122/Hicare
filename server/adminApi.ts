import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { databaseEnabled, dbAddAudit, dbReadAccount, dbReadAudit, dbReadStatuses, dbSaveAccount, dbSaveStatus, type DbAdminAccount, type DbAuditEntry, type DbConditionStatus } from "./adminDb";
import { listActivityLogs, listMembers } from "./db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataCandidates = [path.resolve(__dirname, "data"), path.resolve(__dirname, "..", "server", "data"), path.resolve(process.cwd(), "server", "data"), path.resolve("/tmp", "hicare-admin-data")];
const DATA_DIR = dataCandidates.find((candidate) => fs.existsSync(candidate)) ?? dataCandidates[1]!;
const STATUS_PATH = path.join(DATA_DIR, "conditionStatus.json");
const AUDIT_PATH = path.join(DATA_DIR, "conditionStatusAudit.json");
const ACCOUNT_PATH = path.join(DATA_DIR, "adminAccount.json");
const CONDITION_IDS = ["hypertension", "diabetes", "dyslipidemia", "liver", "ckd", "tuberculosis", "obesity", "heart"];
const SESSION_COOKIE = "hicare_admin_session";
const SESSION_MAX_AGE = 8 * 60 * 60;

type ConditionStatus = DbConditionStatus;
type AuditEntry = DbAuditEntry;
type AdminAccount = DbAdminAccount;

let runtimeStatuses: ConditionStatus[] | undefined;
let runtimeAudit: AuditEntry[] | undefined;
let runtimeAccount: AdminAccount | null | undefined;

const defaultStatuses = (): ConditionStatus[] => CONDITION_IDS.map((conditionId) => ({ conditionId, isActive: true, notice: "", openDate: null }));
function readJson<T>(filePath: string, fallback: T): T { try { return JSON.parse(fs.readFileSync(filePath, "utf8")) as T; } catch { return fallback; } }
function persistJson(filePath: string, value: unknown) { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); } catch (error) { console.warn(`[Hi Care Admin] Could not persist ${path.basename(filePath)}`, error instanceof Error ? error.message : error); } }

async function readStatuses() {
  if (databaseEnabled()) return dbReadStatuses();
  if (!runtimeStatuses) runtimeStatuses = readJson(STATUS_PATH, defaultStatuses());
  return runtimeStatuses;
}
async function saveStatus(value: ConditionStatus) {
  if (databaseEnabled()) return dbSaveStatus(value);
  const statuses = await readStatuses();
  const index = statuses.findIndex((item) => item.conditionId === value.conditionId);
  if (index >= 0) statuses[index] = value; else statuses.push(value);
  runtimeStatuses = statuses;
  persistJson(STATUS_PATH, statuses);
}
async function readAudit() {
  if (databaseEnabled()) return dbReadAudit();
  if (!runtimeAudit) runtimeAudit = readJson<AuditEntry[]>(AUDIT_PATH, []);
  return runtimeAudit;
}
async function saveAudit(value: AuditEntry) {
  if (databaseEnabled()) return dbAddAudit(value);
  runtimeAudit = value ? [value, ...(runtimeAudit ?? [])].slice(0, 200) : runtimeAudit;
  persistJson(AUDIT_PATH, runtimeAudit);
}
async function readAccount() {
  if (databaseEnabled()) return dbReadAccount();
  if (runtimeAccount === undefined) runtimeAccount = readJson<AdminAccount | null>(ACCOUNT_PATH, null);
  return runtimeAccount;
}
async function saveAccount(value: AdminAccount) {
  if (databaseEnabled()) return dbSaveAccount(value);
  runtimeAccount = value;
  persistJson(ACCOUNT_PATH, value);
}

function sessionSecret() { return process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || process.env.ADMIN_API_TOKEN || "hicare-local-preview-session"; }
function setupKey() { return process.env.ADMIN_SETUP_KEY || "010301"; }
function sign(value: string) { return createHmac("sha256", sessionSecret()).update(value).digest("base64url"); }
function createSession(email: string) { const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE; const body = Buffer.from(JSON.stringify({ email, expires }), "utf8").toString("base64url"); return `${body}.${sign(body)}`; }
function getCookie(req: Request, name: string) { return (req.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? ""; }
async function configuredAccount() {
  const stored = await readAccount();
  if (stored) return stored;
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) { const salt = "legacy-admin"; return { email: process.env.ADMIN_EMAIL, salt, passwordHash: scryptSync(process.env.ADMIN_PASSWORD, salt, 64).toString("hex"), createdAt: "" }; }
  return null;
}
function hashPassword(password: string, salt: string) { return scryptSync(password, salt, 64).toString("hex"); }
function passwordMatches(password: string, account: AdminAccount) { const actual = Buffer.from(hashPassword(password, account.salt), "hex"); const expected = Buffer.from(account.passwordHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
async function currentAdmin(req: Request) {
  const account = await configuredAccount();
  const [body, signature] = getCookie(req, SESSION_COOKIE).split(".");
  if (!account || !body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { email: string; expires: number }; return session.email === account.email && session.expires > Math.floor(Date.now() / 1000) ? session.email : null; } catch { return null; }
}
async function requireAdmin(req: Request, res: Response, next: NextFunction) { const email = await currentAdmin(req); if (!email) return res.status(403).json({ message: "Admin 로그인이 필요합니다." }); res.locals.adminEmail = email; return next(); }
function validDate(value: unknown): value is string | null { return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)); }
function validCredentials(email: unknown, password: unknown) { return typeof email === "string" && email.trim().includes("@") && typeof password === "string" && password.length >= 8; }
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function csvFileName(prefix: string) { return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`; }

export function registerAdminRoutes(app: Express) {
  app.get("/api/condition-status", async (_req, res) => { res.setHeader("Cache-Control", "no-store"); try { res.json({ statuses: await readStatuses() }); } catch { res.status(503).json({ message: "상태 저장소를 사용할 수 없습니다." }); } });

  app.post("/api/admin/register", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const providedSetupKey = typeof req.body?.setupKey === "string" ? req.body.setupKey.trim() : "";
    if (await readAccount() || process.env.ADMIN_EMAIL) return res.status(409).json({ message: "관리자 계정이 이미 등록되어 있습니다. 로그인해 주세요." });
    if (providedSetupKey !== setupKey()) return res.status(403).json({ message: "관리자 등록 코드가 올바르지 않습니다. 010301을 입력해 주세요." });
    if (!validCredentials(email, password)) return res.status(400).json({ message: "이메일을 입력하고 비밀번호는 8자 이상 설정해 주세요." });
    const salt = randomBytes(16).toString("hex");
    try { await saveAccount({ email, salt, passwordHash: hashPassword(password, salt), createdAt: new Date().toISOString() }); return res.status(201).json({ message: "관리자 계정이 등록되었습니다. 이제 로그인해 주세요." }); } catch { return res.status(503).json({ message: "관리자 계정을 저장할 수 없습니다." }); }
  });

  app.post("/api/admin/login", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const account = await configuredAccount();
    if (!account) return res.status(503).json({ message: "먼저 관리자 계정을 등록해 주세요." });
    if (email !== account.email || !passwordMatches(password, account)) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${createSession(email)}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${secure}`);
    return res.json({ user: { authenticated: true, role: "admin", email } });
  });
  app.post("/api/admin/logout", (_req, res) => { res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`); res.json({ ok: true }); });
  app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ authenticated: true, role: "admin", email: res.locals.adminEmail }));
  app.get("/api/admin/audit", requireAdmin, async (_req, res) => { try { res.json({ entries: await readAudit() }); } catch { res.status(503).json({ message: "변경 이력을 불러오지 못했습니다." }); } });
  app.get("/api/admin/members", requireAdmin, async (_req, res) => { try { res.json({ members: await listMembers() }); } catch { res.status(503).json({ message: "회원 기록을 불러오지 못했습니다." }); } });
  app.get("/api/admin/activity", requireAdmin, async (_req, res) => { try { res.json({ logs: await listActivityLogs() }); } catch { res.status(503).json({ message: "활동 기록을 불러오지 못했습니다." }); } });
  app.get("/api/admin/export/members", requireAdmin, async (_req, res) => {
    try {
      const members = await listMembers();
      const rows = [
        ["회원 ID", "이름", "이메일", "가입 방식", "역할", "가입 시각", "최근 로그인"],
        ...members.map(member => [member.id, member.name, member.email, member.openId.startsWith("local_") ? "Hi Care 자체 가입" : member.openId, member.role, member.createdAt, member.lastSignedIn]),
      ];
      const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${csvFileName("hicare-members")}`);
      return res.send(csv);
    } catch { return res.status(503).json({ message: "회원 데이터를 내보내지 못했습니다." }); }
  });
  app.get("/api/admin/export/activity", requireAdmin, async (_req, res) => {
    try {
      const logs = await listActivityLogs(100_000);
      const rows = [
        ["로그 ID", "회원 ID", "이름", "이메일", "활동 유형", "질환 ID", "가이드 ID", "추가 정보", "활동 시각"],
        ...logs.map(log => [log.id, log.userId, log.name, log.email, log.eventType, log.conditionId, log.keywordId, log.metadata, log.createdAt]),
      ];
      const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${csvFileName("hicare-activity-logs")}`);
      return res.send(csv);
    } catch { return res.status(503).json({ message: "활동 데이터를 내보내지 못했습니다." }); }
  });
  app.put("/api/admin/condition-status/:conditionId", requireAdmin, async (req, res) => {
    const { conditionId } = req.params;
    if (!CONDITION_IDS.includes(conditionId)) return res.status(400).json({ message: "지원하지 않는 질환입니다." });
    if (typeof req.body?.isActive !== "boolean" || !validDate(req.body?.openDate)) return res.status(400).json({ message: "상태 또는 날짜 형식이 올바르지 않습니다." });
    const notice = typeof req.body.notice === "string" ? req.body.notice.trim().slice(0, 40) : "";
    const openDate = req.body.isActive ? null : req.body.openDate;
    if (!req.body.isActive && !notice && !openDate) return res.status(400).json({ message: "오픈 예정일 또는 안내 문구를 입력해 주세요." });
    const next: ConditionStatus = { conditionId, isActive: req.body.isActive, notice, openDate, updatedAt: new Date().toISOString() };
    const entry: AuditEntry = { id: randomUUID(), conditionId, adminEmail: res.locals.adminEmail, action: req.body.isActive ? "activate" : "schedule", isActive: next.isActive, notice: next.notice, openDate: next.openDate, changedAt: next.updatedAt! };
    try { await saveStatus(next); await saveAudit(entry); return res.json({ status: next }); } catch { return res.status(503).json({ message: "변경 사항을 영구 저장할 수 없습니다." }); }
  });
}
