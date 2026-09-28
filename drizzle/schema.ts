import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const hicareAdminAccounts = mysqlTable("hicare_admin_accounts", {
  id: int("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  salt: varchar("salt", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export const hicareConditionStatuses = mysqlTable("hicare_condition_statuses", {
  conditionId: varchar("conditionId", { length: 64 }).primaryKey(),
  isActive: boolean("isActive").notNull().default(true),
  notice: varchar("notice", { length: 160 }).notNull().default(""),
  openDate: timestamp("openDate"),
  updatedAt: timestamp("updatedAt"),
});

export const hicareConditionAudits = mysqlTable("hicare_condition_audits", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conditionId: varchar("conditionId", { length: 64 }).notNull(),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  action: varchar("action", { length: 16 }).notNull(),
  isActive: boolean("isActive").notNull(),
  notice: varchar("notice", { length: 160 }).notNull().default(""),
  openDate: timestamp("openDate"),
  changedAt: timestamp("changedAt").notNull(),
});
