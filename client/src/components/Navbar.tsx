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
          className="flex items-center text-left group transition hover:opacity-90 cursor-pointer"
        >
          <HeartPulse className="mr-1.5 h-4 w-4 text-teal-600 transition-colors duration-200 group-hover:text-emerald-700 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
          <span className="font-display text-[17px] font-extrabold tracking-[-0.04em] text-teal-700 transition-colors duration-200 group-hover:text-emerald-700 sm:text-[19px]">
            Hi <span className="text-emerald-600">Care</span>
          </span>
        </button>
      </div>
    </header>
  );
};
