import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const baseContext = (user: TrpcContext["user"] = null): TrpcContext => ({
  user,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("activity access control", () => {
  it("rejects activity reports for non-admin visitors", async () => {
    const caller = appRouter.createCaller(baseContext({
      id: 12,
      openId: "employee-12",
      name: "직원",
      email: "employee@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.activity.members()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.activity.logs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires authentication before accepting activity events", async () => {
    const caller = appRouter.createCaller(baseContext());
    await expect(caller.activity.log({ eventType: "page_visit" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("validates the supported activity event types", async () => {
    const caller = appRouter.createCaller(baseContext({
      id: 13,
      openId: "employee-13",
      name: "직원",
      email: "employee13@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }));

    await expect(caller.activity.log({ eventType: "unsupported" as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
