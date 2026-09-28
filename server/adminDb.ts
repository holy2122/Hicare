import mysql from "mysql2/promise";

export type DbAdminAccount = { email: string; passwordHash: string; salt: string; createdAt: string };
export type DbConditionStatus = { conditionId: string; isActive: boolean; notice: string; openDate: string | null; updatedAt?: string };
export type DbAuditEntry = { id: string; conditionId: string; adminEmail: string; action: "activate" | "schedule"; isActive: boolean; notice: string; openDate: string | null; changedAt: string };

const CONDITION_IDS = ["hypertension", "diabetes", "dyslipidemia", "liver", "ckd", "tuberculosis", "obesity", "heart"];
let pool: mysql.Pool | null = null;
let initialized: Promise<void> | null = null;

export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL) && process.env.NODE_ENV !== "test";
}

function getPool() {
  if (!pool) pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 4, dateStrings: true });
  return pool;
}

async function initialize() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS hicare_admin_accounts (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      passwordHash CHAR(128) NOT NULL,
      salt CHAR(32) NOT NULL,
      createdAt DATETIME NOT NULL
    ) ENGINE=InnoDB
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS hicare_condition_statuses (
      conditionId VARCHAR(64) NOT NULL PRIMARY KEY,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      notice VARCHAR(160) NOT NULL DEFAULT '',
      openDate DATE NULL,
      updatedAt DATETIME NULL
    ) ENGINE=InnoDB
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS hicare_condition_audits (
      id VARCHAR(64) NOT NULL PRIMARY KEY,
      conditionId VARCHAR(64) NOT NULL,
      adminEmail VARCHAR(320) NOT NULL,
      action VARCHAR(16) NOT NULL,
      isActive BOOLEAN NOT NULL,
      notice VARCHAR(160) NOT NULL DEFAULT '',
      openDate DATE NULL,
      changedAt DATETIME NOT NULL,
      INDEX condition_audit_time (changedAt)
    ) ENGINE=InnoDB
  `);
  for (const conditionId of CONDITION_IDS) {
    await db.query(
      `INSERT IGNORE INTO hicare_condition_statuses (conditionId, isActive, notice, openDate) VALUES (?, TRUE, '', NULL)`,
      [conditionId],
    );
  }
}

async function ready() {
  if (!initialized) initialized = initialize();
  await initialized;
}

export async function dbReadAccount(): Promise<DbAdminAccount | null> {
  await ready();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT email, passwordHash, salt, createdAt FROM hicare_admin_accounts WHERE id = 1 LIMIT 1");
  const row = rows[0];
  return row ? { email: String(row.email), passwordHash: String(row.passwordHash), salt: String(row.salt), createdAt: String(row.createdAt) } : null;
}

export async function dbSaveAccount(account: DbAdminAccount) {
  await ready();
  await getPool().query(
    `INSERT INTO hicare_admin_accounts (id, email, passwordHash, salt, createdAt) VALUES (1, ?, ?, ?, ?)`,
    [account.email, account.passwordHash, account.salt, account.createdAt],
  );
}

export async function dbReadStatuses(): Promise<DbConditionStatus[]> {
  await ready();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT conditionId, isActive, notice, openDate, updatedAt FROM hicare_condition_statuses ORDER BY FIELD(conditionId, ?)", [CONDITION_IDS.join(",")]);
  return rows.map((row) => ({
    conditionId: String(row.conditionId),
    isActive: Boolean(row.isActive),
    notice: String(row.notice ?? ""),
    openDate: row.openDate ? String(row.openDate).slice(0, 10) : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  }));
}

export async function dbSaveStatus(status: DbConditionStatus) {
  await ready();
  await getPool().query(
    `INSERT INTO hicare_condition_statuses (conditionId, isActive, notice, openDate, updatedAt) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE isActive = VALUES(isActive), notice = VALUES(notice), openDate = VALUES(openDate), updatedAt = VALUES(updatedAt)`,
    [status.conditionId, status.isActive, status.notice, status.openDate, status.updatedAt ? new Date(status.updatedAt) : new Date()],
  );
}

export async function dbAddAudit(entry: DbAuditEntry) {
  await ready();
  await getPool().query(
    `INSERT INTO hicare_condition_audits (id, conditionId, adminEmail, action, isActive, notice, openDate, changedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.conditionId, entry.adminEmail, entry.action, entry.isActive, entry.notice, entry.openDate, new Date(entry.changedAt)],
  );
}

export async function dbReadAudit(): Promise<DbAuditEntry[]> {
  await ready();
  const [rows] = await getPool().query<mysql.RowDataPacket[]>("SELECT id, conditionId, adminEmail, action, isActive, notice, openDate, changedAt FROM hicare_condition_audits ORDER BY changedAt DESC LIMIT 200");
  return rows.map((row) => ({
    id: String(row.id),
    conditionId: String(row.conditionId),
    adminEmail: String(row.adminEmail),
    action: row.action === "activate" ? "activate" : "schedule",
    isActive: Boolean(row.isActive),
    notice: String(row.notice ?? ""),
    openDate: row.openDate ? String(row.openDate).slice(0, 10) : null,
    changedAt: new Date(row.changedAt).toISOString(),
  }));
}
