import React from "react";

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
          <span className="font-display text-[17px] font-semibold italic tracking-[-0.06em] text-rose-700 transition-colors duration-200 group-hover:text-rose-800 sm:text-[19px]">
            Care<span className="ml-0.5 font-serif font-black not-italic text-rose-500">-T</span>
          </span>
        </button>
      </div>
    </header>
  );
};
