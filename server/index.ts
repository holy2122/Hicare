import express, { NextFunction, Request, Response } from "express";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_PATH = path.resolve(process.cwd(), "server", "data", "conditionStatus.json");
const AUDIT_PATH = path.resolve(process.cwd(), "server", "data", "conditionStatusAudit.json");
const CONDITION_IDS = ["hypertension", "diabetes", "dyslipidemia", "liver", "ckd", "tuberculosis", "obesity", "heart"];
const SESSION_COOKIE = "hicare_admin_session";
const SESSION_MAX_AGE = 8 * 60 * 60;
type ConditionStatus = { conditionId: string; isActive: boolean; notice: string; openDate: string | null; updatedAt?: string };
type AuditEntry = { id: string; conditionId: string; adminEmail: string; action: "activate" | "schedule"; isActive: boolean; notice: string; openDate: string | null; changedAt: string };

function readStatuses(): ConditionStatus[] { try { return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as ConditionStatus[]; } catch { return CONDITION_IDS.map((conditionId) => ({ conditionId, isActive: true, notice: "", openDate: null })); } }
function writeStatuses(statuses: ConditionStatus[]) { fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true }); fs.writeFileSync(STATUS_PATH, JSON.stringify(statuses, null, 2) + "\n", "utf8"); }
function readAudit(): AuditEntry[] { try { return JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8")) as AuditEntry[]; } catch { return []; } }
function writeAudit(entries: AuditEntry[]) { fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true }); fs.writeFileSync(AUDIT_PATH, JSON.stringify(entries.slice(0, 200), null, 2) + "\n", "utf8"); }
function secret() { return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_TOKEN || ""; }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }
function createSession(email: string) { const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE; const body = Buffer.from(JSON.stringify({ email, expires }), "utf8").toString("base64url"); return `${body}.${sign(body)}`; }
function getCookie(req: Request, name: string) { return (req.headers.cookie ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? ""; }
function currentAdmin(req: Request) { const configuredEmail = process.env.ADMIN_EMAIL; if (!configuredEmail || !secret()) return null; const [body, signature] = getCookie(req, SESSION_COOKIE).split("."); if (!body || !signature) return null; const expected = sign(body); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null; try { const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { email: string; expires: number }; return session.email === configuredEmail && session.expires > Math.floor(Date.now() / 1000) ? session.email : null; } catch { return null; } }
function requireAdmin(req: Request, res: Response, next: NextFunction) { const email = currentAdmin(req); if (!email) return res.status(403).json({ message: "Admin 로그인이 필요합니다." }); res.locals.adminEmail = email; return next(); }
function validDate(value: unknown): value is string { return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)); }

async function startServer() {
  const app = express(); const server = createServer(app); app.use(express.json({ limit: "20kb" }));
  app.get("/api/condition-status", (_req, res) => { res.setHeader("Cache-Control", "no-store"); res.json({ statuses: readStatuses() }); });
  app.post("/api/admin/login", (req, res) => { const email = typeof req.body?.email === "string" ? req.body.email.trim() : ""; const password = typeof req.body?.password === "string" ? req.body.password : ""; if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !secret()) return res.status(503).json({ message: "관리자 계정 환경변수가 설정되지 않았습니다." }); if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." }); res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${createSession(email)}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`); return res.json({ user: { authenticated: true, role: "admin", email } }); });
  app.post("/api/admin/logout", (_req, res) => { res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`); res.json({ ok: true }); });
  app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ authenticated: true, role: "admin", email: res.locals.adminEmail }));
  app.get("/api/admin/audit", requireAdmin, (_req, res) => res.json({ entries: readAudit() }));
  app.put("/api/admin/condition-status/:conditionId", requireAdmin, (req, res) => { const { conditionId } = req.params; if (!CONDITION_IDS.includes(conditionId)) return res.status(400).json({ message: "지원하지 않는 질환입니다." }); if (typeof req.body?.isActive !== "boolean" || !validDate(req.body?.openDate)) return res.status(400).json({ message: "상태 또는 날짜 형식이 올바르지 않습니다." }); const notice = typeof req.body.notice === "string" ? req.body.notice.trim().slice(0, 40) : ""; const openDate = req.body.isActive ? null : req.body.openDate; if (!req.body.isActive && !notice && !openDate) return res.status(400).json({ message: "오픈 예정일 또는 안내 문구를 입력해 주세요." }); const changedAt = new Date().toISOString(); const next: ConditionStatus = { conditionId, isActive: req.body.isActive, notice, openDate, updatedAt: changedAt }; const statuses = readStatuses(); const index = statuses.findIndex((item) => item.conditionId === conditionId); if (index >= 0) statuses[index] = next; else statuses.push(next); writeStatuses(statuses); const audit = readAudit(); audit.unshift({ id: randomUUID(), conditionId, adminEmail: res.locals.adminEmail, action: req.body.isActive ? "activate" : "schedule", isActive: next.isActive, notice: next.notice, openDate: next.openDate, changedAt }); writeAudit(audit); return res.json({ status: next }); });
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public"); app.use(express.static(staticPath)); app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html"))); const port = process.env.PORT || 3000; server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}
startServer().catch(console.error);
