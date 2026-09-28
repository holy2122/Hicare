import { describe, expect, it } from "vitest";

describe("Admin registration setup", () => {
  it("exposes the configured setup key to the Admin registration service", async () => {
    expect(process.env.ADMIN_SETUP_KEY).toBe("010301");
    const baseUrl = process.env.ADMIN_TEST_BASE_URL ?? "http://127.0.0.1:3105";
    const response = await fetch(`${baseUrl}/api/admin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "setup-test@example.com",
        password: "setup-test-password",
        setupKey: process.env.ADMIN_SETUP_KEY,
      }),
    });
    expect(response.status).toBe(201);
  });
});
