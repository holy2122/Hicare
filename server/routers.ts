import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminProcedure, protectedProcedure } from "./_core/trpc";
import { clearLocalSession, setLocalSession } from "./_core/localAuth";
import { createSupabaseAuthUser, createSupabaseMember, getSupabaseUserByEmail, insertSupabaseActivity, listSupabaseActivityLogs, listSupabaseMembers, requestSupabasePasswordReset, signInSupabaseAuth, updateSupabaseAuthPassword, updateSupabaseLastSignedIn } from "./supabaseClient";
import { scryptSync, timingSafeEqual } from "crypto";
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
      try {
        const auth = await createSupabaseAuthUser({ name: input.name, email: input.email, password: input.password });
        const user = await createSupabaseMember({ authUserId: auth.id, name: input.name, email: input.email });
        if (!user) throw new Error("회원 프로필을 저장하지 못했습니다.");
        const session = await signInSupabaseAuth(input.email, input.password);
        setLocalSession(ctx.res, ctx.req, { accessToken: session.access_token, refreshToken: session.refresh_token });
        return user;
      } catch (error) {
        if (error instanceof Error && /already|exist|duplicate|registered/i.test(error.message)) throw new TRPCError({ code: "CONFLICT", message: "이미 가입된 이메일입니다." });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "회원가입을 완료하지 못했습니다." });
      }
    }),
    login: publicProcedure.input(z.object({
      email: z.string().trim().email().max(320),
      password: z.string().min(1).max(128),
    })).mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      try {
        const session = await signInSupabaseAuth(email, input.password);
        const user = await getSupabaseUserByEmail(email);
        if (!user) throw new Error("profile missing");
        await updateSupabaseLastSignedIn(user.id);
        setLocalSession(ctx.res, ctx.req, { accessToken: session.access_token, refreshToken: session.refresh_token });
        return user;
      } catch {
        const legacy = await getSupabaseUserByEmail(email);
        if (!legacy?.auth_user_id || !legacy.password_hash || !legacy.password_salt) throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        const actual = Buffer.from(scryptSync(input.password, legacy.password_salt, 64).toString("hex"), "hex");
        const expected = Buffer.from(legacy.password_hash, "hex");
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        await updateSupabaseAuthPassword(legacy.auth_user_id, input.password);
        const session = await signInSupabaseAuth(email, input.password);
        await updateSupabaseLastSignedIn(legacy.id);
        setLocalSession(ctx.res, ctx.req, { accessToken: session.access_token, refreshToken: session.refresh_token });
        return legacy;
      }
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().trim().email().max(320) })).mutation(async ({ input }) => {
      try { await requestSupabasePasswordReset(input.email); } catch { /* Do not reveal whether an email is registered. */ }
      return { success: true } as const;
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
    })).mutation(async ({ ctx, input }) => insertSupabaseActivity({ user_id: ctx.user.id, event_type: input.eventType, condition_id: input.conditionId, keyword_id: input.keywordId, metadata: input.metadata })),
    members: adminProcedure.query(() => listSupabaseMembers()),
    logs: adminProcedure.query(() => listSupabaseActivityLogs()),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
