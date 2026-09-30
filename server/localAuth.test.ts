import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const context = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { cookie: () => undefined } as unknown as TrpcContext["res"],
});

describe("local employee authentication", () => {
  it("rejects a signup with an invalid email or short password", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.signup({ name: "직원", email: "not-an-email", password: "short" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a login with an invalid email before touching the database", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.login({ email: "not-an-email", password: "anything" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
