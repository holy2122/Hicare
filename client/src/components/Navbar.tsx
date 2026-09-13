import React from "react";
import { ShieldAlert, Activity, BookOpen, Stethoscope, Search, HeartPulse } from "lucide-react";

interface NavbarProps {
  onReset: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedConditionId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onReset,
  searchQuery,
  setSearchQuery,
  selectedConditionId,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left group transition hover:opacity-90 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-display">
                메디케어<span className="text-teal-600">온</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200/60">
                요관찰자 케어
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              국가일반건강검진 질환의심·유질환 이전 생활중재 가이드
            </p>
          </div>
        </button>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="질환명(고혈압, 당뇨)이나 관리법(식단, 운동, DASH) 검색..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-teal-500 rounded-xl text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-3 focus:ring-teal-500/20 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              지우기
            </button>
          )}
        </div>

        {/* Action badge & Guide */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50/80 border border-teal-200/80 text-teal-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            <span>건강검진 수치 판정 B(요관찰) 전용</span>
          </div>
          <button
            onClick={onReset}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              selectedConditionId
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>8대 질환 대시보드</span>
          </button>
        </div>
      </div>
    </header>
  );
};
