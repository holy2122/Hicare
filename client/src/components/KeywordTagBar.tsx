import React from "react";
import { HealthCondition, HealthKeywordTopic } from "../data/healthData";
import { Tag, Sparkles, CheckCircle2 } from "lucide-react";

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
    <div className="mb-8 space-y-3">
      <div className="rounded-lg border border-green-500 bg-green-50 p-4 text-sm leading-relaxed text-slate-800">
        <p className="font-bold">▶ [질환은 없으나 의심 소견 및 확진 필요한 경우]</p>
        <p className="mt-1.5 text-black"><span className="mr-1 text-xs align-middle">🟢</span>검진 결과상 의심되는 부분이 있어 정확한 진단을 위한 병원 정밀 검사(확진 검사)를 먼저 받으시길 권고드립니다.<br />현재 상태를 개선할 수 있는 아래 가이드북을 참고해 건강관리를 시작해 주세요!</p>
      </div>
      <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-sm leading-relaxed text-slate-800">
        <p className="font-bold">▶ [질환으로 진단받은 경우]</p>
        <p className="mt-1.5"><span className="mr-1 text-xs align-middle">🔴</span>질환으로 진단받아 전문 치료와 관리가 필요한 단계입니다. 병원 정기 진찰 및 전문의 치료를 반드시 병행하시고, 아래 일상 관리를 철저히 준수하세요!</p>
      </div>
      <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-sm transition-all sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100/80 text-teal-800">
              선택 질환
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="rounded-lg bg-teal-50 px-3 py-1 text-teal-800 ring-1 ring-inset ring-teal-200">{condition.name}</span>
            </h2>
          </div>
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
            세부 관리 키워드
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
    </div>
  );
};
