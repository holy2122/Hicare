export interface ConditionAvailability {
  conditionId: string;
  isActive: boolean;
  notice: string;
  openDate: string | null;
  updatedAt?: string;
}

export interface AdminAuditEntry {
  id: string;
  conditionId: string;
  adminEmail: string;
  action: "activate" | "schedule";
  isActive: boolean;
  notice: string;
  openDate: string | null;
  changedAt: string;
}

export interface AdminSession {
  authenticated: boolean;
  role: "admin";
  email: string;
}

export interface MemberRecord {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  lastSignedIn: string;
}

export interface ActivityRecord {
  id: number;
  userId: number;
  eventType: string;
  conditionId: string | null;
  keywordId: string | null;
  metadata: string | null;
  createdAt: string;
  email: string | null;
  name: string | null;
}

export async function loadConditionAvailability(signal?: AbortSignal): Promise<ConditionAvailability[]> {
  try {
    const response = await fetch("/api/condition-status", { signal, cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as { statuses?: ConditionAvailability[] };
    return payload.statuses ?? [];
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return [];
  }
}

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await response.json().catch(() => null)) as { message?: string; user?: AdminSession } | null;
  if (!response.ok || !payload?.user) throw new Error(payload?.message ?? "관리자 로그인에 실패했습니다.");
  return payload.user;
}

export async function registerAdmin(email: string, password: string, setupKey: string): Promise<void> {
  const response = await fetch("/api/admin/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, setupKey }),
  });
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) throw new Error(payload?.message ?? "관리자 계정 등록에 실패했습니다.");
}

export async function loadAdminSession(): Promise<AdminSession | null> {
  const response = await fetch("/api/admin/session", { credentials: "include", cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as AdminSession;
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
}

export async function saveConditionAvailability(status: Pick<ConditionAvailability, "conditionId" | "isActive" | "notice" | "openDate">): Promise<ConditionAvailability> {
  const response = await fetch(`/api/admin/condition-status/${encodeURIComponent(status.conditionId)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: status.isActive, notice: status.notice, openDate: status.openDate }),
  });
  const payload = (await response.json().catch(() => null)) as { message?: string; status?: ConditionAvailability } | null;
  if (!response.ok || !payload?.status) throw new Error(payload?.message ?? "관리자 권한이 없거나 저장에 실패했습니다.");
  return payload.status;
}

export async function loadAdminAudit(): Promise<AdminAuditEntry[]> {
  const response = await fetch("/api/admin/audit", { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error("변경 이력을 불러오지 못했습니다.");
  const payload = (await response.json()) as { entries?: AdminAuditEntry[] };
  return payload.entries ?? [];
}

export async function loadAdminMembers(): Promise<MemberRecord[]> {
  const response = await fetch("/api/admin/members", { credentials: "include", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "회원 기록을 불러오지 못했습니다.");
  return body.members ?? [];
}

export async function loadAdminActivity(): Promise<ActivityRecord[]> {
  const response = await fetch("/api/admin/activity", { credentials: "include", cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message ?? "활동 기록을 불러오지 못했습니다.");
  return body.logs ?? [];
}

export async function downloadAdminExport(kind: "members" | "activity"): Promise<void> {
  const response = await fetch(`/api/admin/export/${kind}`, { credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? "Excel 백업 파일을 생성하지 못했습니다.");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const filename = encodedName ? decodeURIComponent(encodedName) : `hicare-${kind}.csv`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
