import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminProcedure, protectedProcedure } from "./_core/trpc";
import { createActivityLog, listActivityLogs, listMembers } from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
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
