import React, { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Send } from "lucide-react";

export interface SurveyResponse {
  id: string;
  submittedAt: string;
  conditionId: string;
  conditionName: string;
  name: string;
  managementStatus: string;
  biggestChallenge: string;
  preferredCare: string;
  note: string;
}

export const SURVEY_STORAGE_KEY = "care-t-survey-responses";

export default function Survey() {
  const params = new URLSearchParams(window.location.search);
  const conditionId = params.get("condition") || "unknown";
  const conditionName = params.get("name") || "선택 질환";
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", managementStatus: "진단 후 관리 중", biggestChallenge: "", preferredCare: "운동", note: "" });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const current: SurveyResponse[] = JSON.parse(localStorage.getItem(SURVEY_STORAGE_KEY) || "[]");
    current.push({ id: crypto.randomUUID(), submittedAt: new Date().toISOString(), conditionId, conditionName, ...form });
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(current));
    setSubmitted(true);
    window.setTimeout(() => { window.location.href = `/?condition=${encodeURIComponent(conditionId)}`; }, 1200);
  };

  if (submitted) return <div className="grid min-h-screen place-items-center bg-slate-50 px-6"><div className="rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-xl"><CheckCircle2 className="mx-auto h-12 w-12 text-teal-600" /><h1 className="mt-4 text-xl font-extrabold text-slate-900">설문이 저장되었습니다</h1><p className="mt-2 text-sm text-slate-600">잠시 후 {conditionName} 관리 화면으로 돌아갑니다.</p></div></div>;

  return <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10"><main className="mx-auto max-w-2xl"><button type="button" onClick={() => window.history.back()} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-white"><ArrowLeft className="h-5 w-5" />돌아가기</button><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="bg-indigo-600 px-6 py-7 text-white sm:px-8"><div className="flex items-center gap-3"><ClipboardCheck className="h-8 w-8" /><div><p className="text-xs font-bold text-indigo-100">Care-T 건강설문</p><h1 className="mt-1 text-2xl font-extrabold">{conditionName} 관리 상태 알려주기</h1></div></div><p className="mt-4 text-sm leading-relaxed text-indigo-100">답변은 브라우저에 안전하게 저장되며, 제출 후 이전 건강관리 화면으로 돌아갑니다.</p></div><form onSubmit={submit} className="space-y-5 p-6 sm:p-8"><label className="block text-sm font-bold text-slate-800">이름 또는 식별명<input value={form.name} onChange={(e) => update("name", e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" placeholder="예: 홍길동" /></label><label className="block text-sm font-bold text-slate-800">현재 관리 상태<select value={form.managementStatus} onChange={(e) => update("managementStatus", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-indigo-500"><option>진단 후 관리 중</option><option>최근 진단받음</option><option>치료 전 상담 필요</option><option>생활습관을 점검 중</option></select></label><label className="block text-sm font-bold text-slate-800">가장 어려운 점<textarea value={form.biggestChallenge} onChange={(e) => update("biggestChallenge", e.target.value)} required className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500" placeholder="예: 꾸준한 운동이 어렵습니다." /></label><label className="block text-sm font-bold text-slate-800">가장 먼저 받고 싶은 관리<select value={form.preferredCare} onChange={(e) => update("preferredCare", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-indigo-500"><option>운동</option><option>식이습관</option><option>복약·진료 관리</option><option>생활습관 기록</option></select></label><label className="block text-sm font-bold text-slate-800">추가 메모<span className="ml-1 font-normal text-slate-400">(선택)</span><textarea value={form.note} onChange={(e) => update("note", e.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500" /></label><button type="submit" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-extrabold text-white shadow-[0_5px_0_#3730a3] transition hover:bg-indigo-700 active:translate-y-1 active:shadow-none"><Send className="h-5 w-5" />제출하고 건강관리 화면으로 돌아가기</button></form></section><p className="mt-5 text-center text-xs text-slate-400">프로토타입 저장 방식: 현재 브라우저의 로컬 저장소</p></main></div>;
}
