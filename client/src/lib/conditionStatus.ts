export interface ConditionAvailability {
  conditionId: string;
  isActive: boolean;
  notice: string;
  updatedAt?: string;
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

export async function verifyAdminToken(token: string): Promise<boolean> {
  const response = await fetch("/api/admin/session", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return response.ok;
}

export async function saveConditionAvailability(token: string, status: Pick<ConditionAvailability, "conditionId" | "isActive" | "notice">): Promise<ConditionAvailability> {
  const response = await fetch(`/api/admin/condition-status/${encodeURIComponent(status.conditionId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: status.isActive, notice: status.notice }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "관리자 권한이 없거나 저장에 실패했습니다.");
  }
  return ((await response.json()) as { status: ConditionAvailability }).status;
}
