import express from "express";
import fs from "fs";
import http from "http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerAdminRoutes } from "./adminApi";

let server: http.Server;
let baseUrl = "";
let originalAccount = "";
let originalSupabaseKey: string | undefined;

async function request(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, init);
}

describe("Admin availability API", () => {
  beforeAll(async () => {
    process.env.ADMIN_SETUP_KEY = "010301";
    process.env.ADMIN_SESSION_SECRET = "vitest-admin-session-secret";
    originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    originalAccount = fs.readFileSync(new URL("./data/adminAccount.json", import.meta.url), "utf8");
    fs.writeFileSync(new URL("./data/adminAccount.json", import.meta.url), "null\n");

    const app = express();
    app.use(express.json());
    registerAdminRoutes(app);
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a port");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    if (originalSupabaseKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey;
    fs.writeFileSync(new URL("./data/adminAccount.json", import.meta.url), originalAccount);
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  it("returns public condition availability without authentication", async () => {
    const response = await request("/api/condition-status");
    expect(response.status).toBe(200);
    const body = await response.json() as { statuses: Array<{ conditionId: string }> };
    expect(body.statuses).toHaveLength(8);
  });

  it("rejects an invalid setup code", async () => {
    const response = await request("/api/admin/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "secure-pass-123", setupKey: "000000" }),
    });
    expect(response.status).toBe(403);
  });

  it("registers, logs in, and authorizes an Admin session with 010301", async () => {
    const registration = await request("/api/admin/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "secure-pass-123", setupKey: "010301" }),
    });
    expect(registration.status).toBe(201);

    const login = await request("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "secure-pass-123" }),
    });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie");
    expect(cookie).toContain("hicare_admin_session=");

    const session = await request("/api/admin/session", { headers: { cookie: cookie ?? "" } });
    expect(session.status).toBe(200);
    expect((await session.json()).role).toBe("admin");

    const save = await request("/api/admin/condition-status/diabetes", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: cookie ?? "" },
      body: JSON.stringify({ isActive: false, notice: "10월 오픈 예정", openDate: "2026-10-15" }),
    });
    expect(save.status).toBe(200);

    const audit = await request("/api/admin/audit", { headers: { cookie: cookie ?? "" } });
    expect(audit.status).toBe(200);
    expect((await audit.json()).entries[0].conditionId).toBe("diabetes");
  });

  it("rejects member and activity exports without an Admin session", async () => {
    expect((await request("/api/admin/export/members")).status).toBe(403);
    expect((await request("/api/admin/export/activity")).status).toBe(403);
  });
});
