import React from "react";
import { HeartPulse, LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "../const";

interface NavbarProps {
  onReset: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedConditionId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onReset,
  searchQuery,
  setSearchQuery,
  selectedConditionId,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center text-left group transition hover:opacity-90 cursor-pointer"
        >
          <HeartPulse className="mr-1.5 h-4 w-4 text-teal-600 transition-colors duration-200 group-hover:text-emerald-700 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
          <span className="font-display text-[17px] font-extrabold tracking-[-0.04em] text-teal-700 transition-colors duration-200 group-hover:text-emerald-700 sm:text-[19px]">
            Hi <span className="text-emerald-600">Care</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={startLogin} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-teal-700 px-2.5 text-xs font-bold text-white transition hover:bg-teal-800">
            직원 회원가입·로그인
          </button>
          <Link href="/admin" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700">
            <LockKeyhole className="h-3.5 w-3.5" /> 관리자
          </Link>
        </div>
      </div>
    </header>
  );
};
