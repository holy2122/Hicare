import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_PATH = path.resolve(process.cwd(), "server", "data", "conditionStatus.json");
const CONDITION_IDS = ["hypertension", "diabetes", "dyslipidemia", "liver", "ckd", "tuberculosis", "obesity", "heart"];

type ConditionStatus = { conditionId: string; isActive: boolean; notice: string; updatedAt?: string };

function readStatuses(): ConditionStatus[] {
  try {
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as ConditionStatus[];
  } catch {
    return CONDITION_IDS.map((conditionId) => ({ conditionId, isActive: true, notice: "" }));
  }
}

function writeStatuses(statuses: ConditionStatus[]) {
  fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true });
  fs.writeFileSync(STATUS_PATH, JSON.stringify(statuses, null, 2) + "\n", "utf8");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  const authorization = req.header("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!configuredToken || !token || token !== configuredToken) {
    return res.status(403).json({ message: "Admin 권한이 필요합니다." });
  }
  return next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "20kb" }));

  app.get("/api/condition-status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ statuses: readStatuses() });
  });

  app.get("/api/admin/session", requireAdmin, (_req, res) => {
    res.json({ authenticated: true, role: "admin" });
  });

  app.put("/api/admin/condition-status/:conditionId", requireAdmin, (req, res) => {
    const { conditionId } = req.params;
    if (!CONDITION_IDS.includes(conditionId)) return res.status(400).json({ message: "지원하지 않는 질환입니다." });
    if (typeof req.body?.isActive !== "boolean") return res.status(400).json({ message: "isActive 값이 필요합니다." });
    const notice = typeof req.body.notice === "string" ? req.body.notice.trim().slice(0, 40) : "";
    if (!req.body.isActive && !notice) return res.status(400).json({ message: "비활성화 안내 문구를 입력해 주세요." });
    const statuses = readStatuses();
    const next: ConditionStatus = { conditionId, isActive: req.body.isActive, notice, updatedAt: new Date().toISOString() };
    const index = statuses.findIndex((item) => item.conditionId === conditionId);
    if (index >= 0) statuses[index] = next;
    else statuses.push(next);
    writeStatuses(statuses);
    return res.json({ status: next });
  });

  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}/`));
}

startServer().catch(console.error);
