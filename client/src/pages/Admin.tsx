import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { loadHealthConditions, HealthCondition } from "../data/healthData";
import {
  ConditionAvailability,
  loadConditionAvailability,
  saveConditionAvailability,
  verifyAdminToken,
} from "../lib/conditionStatus";

const DEFAULT_NOTICE = "서비스 준비 중";

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("hicare_admin_token") ?? "");
  const [isVerified, setIsVerified] = useState(false);
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ConditionAvailability>>({});
  const [drafts, setDrafts] = useState<Record<string, ConditionAvailability>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const orderedStatuses = useMemo(
    () => conditions.map((condition) => drafts[condition.id]).filter(Boolean),
    [conditions, drafts],
  );

  async function authorize(nextToken = token) {
    setMessage(null);
    if (!nextToken.trim()) {
      setMessage("관리자 인증 토큰을 입력해 주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const verified = await verifyAdminToken(nextToken.trim());
      if (!verified) throw new Error("Admin 권한이 확인되지 않았습니다.");
      sessionStorage.setItem("hicare_admin_token", nextToken.trim());
      setToken(nextToken.trim());
      setIsVerified(true);
      const [healthConditions, availability] = await Promise.all([
        loadHealthConditions(),
        loadConditionAvailability(),
      ]);
      const byId = Object.fromEntries(availability.map((item) => [item.conditionId, item]));
      setConditions(healthConditions);
      setStatuses(byId);
      setDrafts(byId);
    } catch (error) {
      setIsVerified(false);
      setMessage(error instanceof Error ? error.message : "관리자 인증에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) void authorize(token);
    // Admin token is intentionally checked against the server on every page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDraft(conditionId: string, patch: Partial<ConditionAvailability>) {
    setDrafts((current) => ({
      ...current,
      [conditionId]: { ...current[conditionId], ...patch },
    }));
  }

  async function save(conditionId: string) {
    const draft = drafts[conditionId];
    if (!draft) return;
    setMessage(null);
    try {
      const saved = await saveConditionAvailability(token, {
        conditionId,
        isActive: draft.isActive,
        notice: draft.notice.trim() || DEFAULT_NOTICE,
      });
      setStatuses((current) => ({ ...current, [conditionId]: saved }));
      setDrafts((current) => ({ ...current, [conditionId]: saved }));
      setMessage(`${conditions.find((condition) => condition.id === conditionId)?.name} 상태를 저장했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  if (!isVerified) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><LockKeyhole className="h-5 w-5" /></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-teal-700">Hi Care Admin</p><h1 className="text-xl font-extrabold">관리자 인증</h1></div>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">질환 카드 공개 상태를 변경하려면 서버에서 발급한 Admin 인증 토큰이 필요합니다. 일반 회원에게는 관리자 설정 화면이 공개되지 않습니다.</p>
          <label className="block text-sm font-bold text-slate-700" htmlFor="admin-token">Admin 토큰</label>
          <input id="admin-token" type="password" value={token} onChange={(event) => setToken(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void authorize(); }} placeholder="관리자 인증 토큰" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
          {message && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{message}</p>}
          <button disabled={isLoading} onClick={() => void authorize()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{isLoading ? "확인 중…" : "Admin 권한 확인"}</button>
          <Link href="/" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline"><ArrowLeft className="h-4 w-4" />홈으로 돌아가기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800"><ShieldCheck className="h-3.5 w-3.5" />Admin 전용</div><h1 className="text-2xl font-extrabold">질환 카드 공개 상태 관리</h1><p className="mt-1 text-sm text-slate-500">비활성화한 카드는 일반 화면에서 클릭할 수 없고 오픈 예정 안내가 표시됩니다.</p></div>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-700"><ArrowLeft className="h-4 w-4" />사이트 보기</Link>
        </div>
        {message && <p className="mb-4 rounded-xl bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">{message}</p>}
        <div className="space-y-3">
          {orderedStatuses.map((draft) => {
            const condition = conditions.find((item) => item.id === draft.conditionId);
            if (!condition) return null;
            return (
              <section key={draft.conditionId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="font-extrabold text-slate-900">{condition.name}</h2><p className="mt-1 text-xs text-slate-500">현재 상태: {draft.isActive ? "활성화" : "오픈 예정"}</p></div>
                  <div className="flex items-center gap-3"><span className={`text-sm font-bold ${draft.isActive ? "text-teal-700" : "text-slate-500"}`}>{draft.isActive ? "활성화" : "비활성화"}</span><button type="button" role="switch" aria-checked={draft.isActive} onClick={() => updateDraft(draft.conditionId, { isActive: !draft.isActive })} className={`relative h-7 w-12 rounded-full transition ${draft.isActive ? "bg-teal-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${draft.isActive ? "left-6" : "left-1"}`} /></button></div>
                </div>
                {!draft.isActive && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={draft.notice} onChange={(event) => updateDraft(draft.conditionId, { notice: event.target.value })} placeholder={DEFAULT_NOTICE} maxLength={40} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" /><button onClick={() => void save(draft.conditionId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-teal-700"><Save className="h-4 w-4" />저장</button></div>}
                {draft.isActive && <button onClick={() => void save(draft.conditionId)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:border-teal-300 hover:text-teal-700"><Save className="h-4 w-4" />활성 상태 저장</button>}
                {statuses[draft.conditionId] && statuses[draft.conditionId].notice !== draft.notice && !draft.isActive && <p className="mt-2 text-xs font-semibold text-amber-700">아직 저장되지 않은 안내 문구가 있습니다.</p>}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
