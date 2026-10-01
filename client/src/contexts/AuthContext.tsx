import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseReady } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  created_at: string;
}

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    adminCode?: string
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function toKorean(message: string) {
  if (/invalid login/i.test(message)) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/already registered/i.test(message)) return "이미 가입된 이메일입니다.";
  if (/not confirmed/i.test(message))
    return "Supabase에서 'Confirm email' 설정이 켜져 있습니다. Authentication > Sign In / Providers > Email 에서 꺼 주세요.";
  if (/database error saving new user/i.test(message)) return "회원가입 처리 중 오류가 발생했습니다. 관리자 코드를 확인해 주세요.";
  if (/password/i.test(message)) return "비밀번호는 8자 이상이어야 합니다.";
  if (/rate limit/i.test(message)) return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseReady);

  useEffect(() => {
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!supabaseReady) return;
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        const p = data as Profile | null;
        if (p?.status === "suspended") {
          supabase.auth.signOut();
          setProfile(null);
        } else {
          setProfile(p);
        }
        setLoading(false);
      });
  }, [userId]);

  const signUp: AuthValue["signUp"] = async (email, password, name, adminCode) => {
    // 관리자 코드는 서버(DB 트리거)에서 검증합니다. 브라우저 코드에는 정답 코드가 없습니다.
    const meta: Record<string, string> = { name };
    if (adminCode) meta.admin_code = adminCode;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) {
      if (adminCode && /database error saving new user/i.test(error.message)) {
        return { error: "관리자 코드가 올바르지 않습니다." };
      }
      return { error: toKorean(error.message) };
    }

    // 이메일 인증을 쓰지 않으므로 가입 즉시 세션이 생깁니다.
    // (Supabase 설정에서 Confirm email 이 꺼져 있으면 data.session 이 바로 존재)
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: toKorean(signInError.message) };
    }
    logActivity("signup");
    return { error: null };
  };

  const signIn: AuthValue["signIn"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toKorean(error.message);
    const { data: p } = await supabase.from("profiles").select("status").eq("id", data.user.id).single();
    if (p?.status === "suspended") {
      await supabase.auth.signOut();
      return "이용이 정지된 계정입니다. 관리자에게 문의해 주세요.";
    }
    logActivity("login");
    return null;
  };

  const signOut = async () => {
    await logActivity("logout");
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === "admin" && profile.status === "active";

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
