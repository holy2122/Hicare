import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminProcedure, protectedProcedure } from "./_core/trpc";
import { clearLocalSession, setLocalSession } from "./_core/localAuth";
import { authenticateLocalUser, createActivityLog, createLocalUser, listActivityLogs, listMembers } from "./db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    signup: publicProcedure.input(z.object({
      name: z.string().trim().min(1).max(80),
      email: z.string().trim().email().max(320),
      password: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await createLocalUser({
        name: input.name,
        email: input.email.toLowerCase(),
        password: input.password,
      });
      if (!user) throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 이메일입니다." });
      if (!user.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "회원가입을 완료하지 못했습니다." });
      setLocalSession(ctx.res, ctx.req, user.id);
      return user;
    }),
    login: publicProcedure.input(z.object({
      email: z.string().trim().email().max(320),
      password: z.string().min(1).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await authenticateLocalUser(input.email.toLowerCase(), input.password);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      setLocalSession(ctx.res, ctx.req, user.id);
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      clearLocalSession(ctx.res, ctx.req);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  activity: router({
    log: protectedProcedure.input(z.object({
      eventType: z.enum(["page_visit", "condition_open", "guide_open"]),
      conditionId: z.string().max(64).optional(),
      keywordId: z.string().max(128).optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })).mutation(async ({ ctx, input }) => createActivityLog({
      userId: ctx.user.id,
      eventType: input.eventType,
      conditionId: input.conditionId,
      keywordId: input.keywordId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
    })),
    members: adminProcedure.query(() => listMembers()),
    logs: adminProcedure.query(() => listActivityLogs()),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
