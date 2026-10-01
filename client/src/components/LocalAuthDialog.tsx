import { useState } from "react";
import { KeyRound, LogIn, UserPlus, X } from "lucide-react";
import { trpc } from "../lib/trpc";

type LocalAuthDialogProps = { onClose: () => void };
type AuthMode = "login" | "signup" | "reset";

export function LocalAuthDialog({ onClose }: LocalAuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); onClose(); } });
  const signup = trpc.auth.signup.useMutation({ onSuccess: async () => { await utils.auth.me.invalidate(); onClose(); } });
  const reset = trpc.auth.requestPasswordReset.useMutation({ onSuccess: () => setNotice("입력한 이메일이 가입되어 있다면 비밀번호 재설정 메일을 보냈습니다.") });
  const pending = login.isPending || signup.isPending || reset.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (mode === "reset") {
      reset.mutate({ email }, { onError: (cause) => setError(cause.message) });
    } else if (mode === "signup") {
      signup.mutate({ name, email, password }, { onError: (cause) => setError(cause.message) });
    } else {
      login.mutate({ email, password }, { onError: (cause) => setError(cause.message) });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="local-auth-title">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.16em] text-teal-600">HI CARE MEMBER · SUPABASE AUTH</p>
            <h2 id="local-auth-title" className="text-2xl font-extrabold text-slate-900">{mode === "signup" ? "회원가입" : mode === "reset" ? "비밀번호 재설정" : "직원 로그인"}</h2>
            <p className="mt-1 text-sm text-slate-500">{mode === "reset" ? "가입한 이메일로 재설정 안내를 보내드립니다." : "Manus 계정 없이 Hi Care에서 바로 이용하세요."}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="닫기"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <label className="block text-sm font-bold text-slate-700">이름<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="홍길동" /></label>}
          <label className="block text-sm font-bold text-slate-700">이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="employee@company.com" /></label>
          {mode !== "reset" && <label className="block text-sm font-bold text-slate-700">비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "signup" ? 8 : 1} maxLength={128} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" placeholder="8자 이상" /></label>}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
          {notice && <p className="rounded-xl bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-800" role="status">{notice}</p>}
          <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            {mode === "signup" ? <UserPlus className="h-4 w-4" /> : mode === "reset" ? <KeyRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {pending ? "처리 중…" : mode === "signup" ? "Hi Care 회원가입" : mode === "reset" ? "재설정 메일 보내기" : "로그인"}
          </button>
        </form>

        {mode === "login" && <button type="button" onClick={() => { setMode("reset"); setError(null); setNotice(null); }} className="mt-4 w-full text-center text-sm font-bold text-slate-500 hover:text-teal-700 hover:underline">비밀번호를 잊으셨나요?</button>}
        <button type="button" onClick={() => { setMode(mode === "signup" || mode === "reset" ? "login" : "signup"); setError(null); setNotice(null); }} className="mt-5 w-full text-center text-sm font-bold text-teal-700 hover:underline">
          {mode === "signup" ? "이미 계정이 있습니다. 로그인" : mode === "reset" ? "로그인으로 돌아가기" : "처음 이용하시나요? 회원가입"}
        </button>
      </div>
    </div>
  );
}
