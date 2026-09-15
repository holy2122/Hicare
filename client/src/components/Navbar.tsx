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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left group transition hover:opacity-90 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-display">Hi Care</span>
        </button>
      </div>
    </header>
  );
};
