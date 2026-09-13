import React from "react";
import { HealthCondition, HealthKeywordTopic } from "../data/healthData";
import { Tag, Sparkles, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";

interface KeywordTagBarProps {
  condition: HealthCondition;
  selectedKeywordId: string | null;
  onSelectKeyword: (kw: HealthKeywordTopic) => void;
  onResetCondition: () => void;
}

export const KeywordTagBar: React.FC<KeywordTagBarProps> = ({
  condition,
  selectedKeywordId,
  onSelectKeyword,
  onResetCondition,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-teal-200/90 shadow-sm p-4 sm:p-6 mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100/80 text-teal-800">
              선택 질환
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>{condition.name}</span>
              <span className="text-sm font-normal text-slate-400">
                ({condition.englishName})
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {condition.normalRangeLabel} ·{" "}
            <span className="text-teal-700 font-medium">
              {condition.observationThreshold}
            </span>
          </p>
        </div>

        <button
          onClick={onResetCondition}
          className="self-start md:self-auto text-xs sm:text-sm text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
        >
          다른 질환 선택하기
        </button>
      </div>

      {/* Interactive Keyword Tags */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-teal-600" />
          <span className="text-xs sm:text-sm font-semibold text-slate-800">
            세부 관리 키워드를 선택하세요 (클릭 시 하단 상세 페이지가 열립니다):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {condition.keywords.map((kw) => {
            const isKwActive = selectedKeywordId === kw.id;
            return (
              <button
                key={kw.id}
                onClick={() => onSelectKeyword(kw)}
                className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                  isKwActive
                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-transparent shadow-md shadow-teal-600/25 scale-[1.02]"
                    : "bg-slate-50 hover:bg-teal-50/80 text-slate-700 hover:text-teal-800 border-slate-200/80 hover:border-teal-300"
                }`}
              >
                {isKwActive ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-100" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 group-hover:scale-110 transition-transform" />
                )}
                <span>{kw.tag}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md ${
                    isKwActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/70 text-slate-600 group-hover:bg-teal-200/50 group-hover:text-teal-900"
                  }`}
                >
                  가이드 보기
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
