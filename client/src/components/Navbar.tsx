import React from "react";
import { HeartPulse } from "lucide-react";

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
          className="flex items-center gap-1.5 text-left group transition hover:opacity-90 cursor-pointer"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <HeartPulse className="w-3 h-3 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-[10px] sm:text-xs tracking-tight text-slate-900 font-display">Hi Care</span>
        </button>
      </div>
    </header>
  );
};
