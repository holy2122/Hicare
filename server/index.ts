import express, { NextFunction, Request, Response } from "express";
import { createHmac } from "crypto";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const STATUS_PATH = path.join(DATA_DIR, "conditionStatus.json");
const AUDIT_PATH = path.join(DATA_DIR, "conditionStatusAudit.json");
const ACCOUNT_PATH = path.join(DATA_DIR, "adminAccount.json");
const CONDITION_IDS = ["hypertension", "diabetes", "dyslipidemia", "liver", "ckd", "tuberculosis", "obesity", "heart"];
const SESSION_COOKIE = "hicare_admin_session";
const SESSION_MAX_AGE = 8 * 60 * 60;
type ConditionStatus = { conditionId: string; isActive: boolean; notice: string; openDate: string | null; updatedAt?: string };
type AuditEntry = { id: string; conditionId: string; adminEmail: string; action: "activate" | "schedule"; isActive: boolean; notice: string; openDate: string | null; changedAt: string };
type AdminAccount = { email: string; passwordHash: string; salt: string; createdAt: string };

function readJson<T>(filePath: string, fallback: T): T { try { return JSON.parse(fs.readFileSync(filePath, "utf8")) as T; } catch { return fallback; } }
function writeJson(filePath: string, value: unknown) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8"); }
function readStatuses(): ConditionStatus[] { return readJson(STATUS_PATH, CONDITION_IDS.map((conditionId) => ({ conditionId, isActive: true, notice: "", openDate: null }))); }
function readAudit(): AuditEntry[] { return readJson(AUDIT_PATH, []); }
function readAccount(): AdminAccount | null { return readJson<AdminAccount | null>(ACCOUNT_PATH, null); }
function secret() { return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_TOKEN || (process.env.NODE_ENV !== "production" ? "hicare-local-preview-session" : ""); }
function setupKey() { return process.env.ADMIN_SETUP_KEY || (process.env.NODE_ENV !== "production" ? "010301" : ""); }
function setupKeyMatches(provided: string) { return Boolean(setupKey()) && provided === setupKey(); }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
function createSession(email: string) { const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE; const body = Buffer.from(JSON.stringify({ email, expires }), "utf8").toString("base64url"); return `${body}.${sign(body)}`; }
function getCookie(req: Request, name: string) { return (req.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? ""; }
function configuredAccount(): AdminAccount | null { const stored = readAccount(); if (stored) return stored; if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) { const salt = "legacy-admin"; return { email: process.env.ADMIN_EMAIL, salt, passwordHash: scryptSync(process.env.ADMIN_PASSWORD, salt, 64).toString("hex"), createdAt: "" }; } return null; }
function hashPassword(password: string, salt: string) { return scryptSync(password, salt, 64).toString("hex"); }
function passwordMatches(password: string, account: AdminAccount) { const actual = Buffer.from(hashPassword(password, account.salt), "hex"); const expected = Buffer.from(account.passwordHash, "hex"); return actual.length === expected.length && timingSafeEqual(actual, expected); }
function currentAdmin(req: Request) { const account = configuredAccount(); if (!account || !secret()) return null; const [body, signature] = getCookie(req, SESSION_COOKIE).split("."); if (!body || !signature) return null; const expected = sign(body); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { email: string; expires: number }; return session.email === account.email && session.expires > Math.floor(Date.now() / 1000) ? session.email : null; } catch { return null; } }
function requireAdmin(req: Request, res: Response, next: NextFunction) { const email = currentAdmin(req); if (!email) return res.status(403).json({ message: "Admin 로그인이 필요합니다." }); res.locals.adminEmail = email; return next(); }
function validDate(value: unknown): value is string | null { return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)); }
function validCredentials(email: unknown, password: unknown) { return typeof email === "string" && email.trim().includes("@") && typeof password === "string" && password.length >= 8; }

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "20kb" }));
  app.get("/api/condition-status", (_req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ statuses: readStatuses() }); });
  app.post("/api/admin/register", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const providedSetupKey = typeof req.body?.setupKey === "string" ? req.body.setupKey : "";
    if (readAccount() || process.env.ADMIN_EMAIL) return res.status(409).json({ message: "관리자 계정이 이미 등록되어 있습니다." });
    if (!setupKeyMatches(providedSetupKey)) return res.status(403).json({ message: "관리자 등록 코드가 올바르지 않습니다." });
    if (!validCredentials(email, password)) return res.status(400).json({ message: "이메일을 입력하고 비밀번호는 8자 이상 설정해 주세요." });
    const salt = randomBytes(16).toString("hex");
    writeJson(ACCOUNT_PATH, { email, salt, passwordHash: hashPassword(password, salt), createdAt: new Date().toISOString() } satisfies AdminAccount);
    return res.status(201).json({ message: "관리자 계정이 등록되었습니다." });
  });
  app.post("/api/admin/login", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const account = configuredAccount();
    if (!account || !secret()) return res.status(503).json({ message: "관리자 계정 또는 세션 시크릿이 설정되지 않았습니다." });
    if (email !== account.email || !passwordMatches(password, account)) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${createSession(email)}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return res.json({ user: { authenticated: true, role: "admin", email } });
  });
  app.post("/api/admin/logout", (_req, res) => { res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`); res.json({ ok: true }); });
  app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ authenticated: true, role: "admin", email: res.locals.adminEmail }));
  app.get("/api/admin/audit", requireAdmin, (_req, res) => res.json({ entries: readAudit() }));
  app.put("/api/admin/condition-status/:conditionId", requireAdmin, (req, res) => {
    const { conditionId } = req.params;
    if (!CONDITION_IDS.includes(conditionId)) return res.status(400).json({ message: "지원하지 않는 질환입니다." });
    if (typeof req.body?.isActive !== "boolean" || !validDate(req.body?.openDate)) return res.status(400).json({ message: "상태 또는 날짜 형식이 올바르지 않습니다." });
    const notice = typeof req.body.notice === "string" ? req.body.notice.trim().slice(0, 40) : "";
    const openDate = req.body.isActive ? null : req.body.openDate;
    if (!req.body.isActive && !notice && !openDate) return res.status(400).json({ message: "오픈 예정일 또는 안내 문구를 입력해 주세요." });
    const changedAt = new Date().toISOString();
    const next: ConditionStatus = { conditionId, isActive: req.body.isActive, notice, openDate, updatedAt: changedAt };
    const statuses = readStatuses(); const index = statuses.findIndex((item) => item.conditionId === conditionId); if (index >= 0) statuses[index] = next; else statuses.push(next); writeJson(STATUS_PATH, statuses);
    const audit = readAudit(); audit.unshift({ id: randomUUID(), conditionId, adminEmail: res.locals.adminEmail, action: req.body.isActive ? "activate" : "schedule", isActive: next.isActive, notice: next.notice, openDate: next.openDate, changedAt }); writeJson(AUDIT_PATH, audit.slice(0, 200));
    return res.json({ status: next });
  });
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath)); app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  const port = process.env.PORT || 3000; server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}
startServer().catch(console.error);
