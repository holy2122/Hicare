import { describe, expect, it } from "vitest";

describe("Supabase service connection", () => {
  it("accepts the configured service-role credential for the Auth settings endpoint", async () => {
    const url = process.env.SUPABASE_URL ?? "https://qgszvmlrqcafrgenusdj.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as { external?: Record<string, boolean> };
    expect(body).toHaveProperty("external");
  });
});
