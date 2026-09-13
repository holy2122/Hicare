import React, { useState, useMemo } from "react";
import { HEALTH_CONDITIONS, HealthCondition, HealthKeywordTopic } from "../data/healthData";
import { Navbar } from "../components/Navbar";
import { ConditionCard } from "../components/ConditionCard";
import { KeywordTagBar } from "../components/KeywordTagBar";
import { KeywordDetailView } from "../components/KeywordDetailView";
import {
  Activity,
  HeartPulse,
  Sparkles,
  Info,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  CalendarCheck2,
} from "lucide-react";

export default function Home() {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>("hypertension");
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>("hypertension-exercise");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Get active condition
  const selectedCondition = useMemo(() => {
    return HEALTH_CONDITIONS.find((c) => c.id === selectedConditionId) || null;
  }, [selectedConditionId]);

  // Get active keyword topic
  const selectedKeyword = useMemo(() => {
    if (!selectedCondition) return null;
    return (
      selectedCondition.keywords.find((k) => k.id === selectedKeywordId) ||
      selectedCondition.keywords[0]
    );
  }, [selectedCondition, selectedKeywordId]);

  // Filtered conditions for search and category
  const filteredConditions = useMemo(() => {
    return HEALTH_CONDITIONS.filter((item) => {
      const matchCategory =
        categoryFilter === "ALL" || item.category.includes(categoryFilter);

      if (!searchQuery.trim()) return matchCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchEng = item.englishName.toLowerCase().includes(q);
      const matchDesc = item.shortDesc.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some(
        (kw) =>
          kw.tag.toLowerCase().includes(q) ||
          kw.title.toLowerCase().includes(q) ||
          kw.shortActionSummary.toLowerCase().includes(q)
      );

      return matchCategory && (matchName || matchEng || matchDesc || matchKeywords);
    });
  }, [categoryFilter, searchQuery]);

  const handleSelectCondition = (condition: HealthCondition) => {
    setSelectedConditionId(condition.id);
    // select first keyword tag automatically
    if (condition.keywords.length > 0) {
      setSelectedKeywordId(condition.keywords[0].id);
    }
  };

  const handleSelectKeyword = (kw: HealthKeywordTopic) => {
    setSelectedKeywordId(kw.id);
  };

  const handleResetToAll = () => {
    setSelectedConditionId(null);
    setSelectedKeywordId(null);
    setSearchQuery("");
    setCategoryFilter("ALL");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col gradient-mesh">
      {/* Top Navigation */}
      <Navbar
        onReset={handleResetToAll}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedConditionId={selectedConditionId}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/80 text-teal-800 mb-3 border border-teal-200/60">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>건강검진 사후관리 임상 가이드라인 기반</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                일반건강검진 요관찰자(B판정) 맞춤 건강
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                검진 결과지에서 ‘질환의심(C)’ 전 단계인 <strong>요관찰(B)</strong> 판정을 받으셨나요?
                약물 치료 전 생활습관 교정으로 회복 가능한 <strong>8대 핵심 질환</strong>을 클릭하고,
                의학적 근거가 검증된 실천 가이드와 운동 영상을 확인하세요.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2 self-start lg:self-auto bg-white/90 border border-slate-200/80 rounded-2xl p-2.5 shadow-xs text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="font-semibold text-slate-700">관리 대상 8대 질환</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-slate-500 px-1">의학 근거 & 영상 100% 탑재</span>
            </div>
          </div>
        </div>

        {/* 8 Conditions Grid Dashboard Section */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold text-slate-900">
                8대 질환 관리 대시보드
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
                {filteredConditions.length}개 표시 중
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "전체 질환" },
                { id: "심뇌혈관", label: "심뇌혈관" },
                { id: "내분비", label: "내분비·대사" },
                { id: "소화기", label: "소화기(간)" },
                { id: "신장", label: "신장" },
                { id: "호흡기", label: "호흡기" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    categoryFilter === tab.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 8-Grid Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredConditions.map((condition) => (
              <ConditionCard
                key={condition.id}
                condition={condition}
                isSelected={selectedConditionId === condition.id}
                onSelect={handleSelectCondition}
              />
            ))}
          </div>
        </section>

        {/* Interactive Keyword Tags & Final Detail Flow */}
        {selectedCondition && (
          <div className="scroll-mt-24 pt-4" id="detail-section">
            {/* Tag Selection Bar */}
            <KeywordTagBar
              condition={selectedCondition}
              selectedKeywordId={selectedKeyword?.id || null}
              onSelectKeyword={handleSelectKeyword}
              onResetCondition={() => setSelectedConditionId(null)}
            />

            {/* 3-Section Final Detail Flow: [행동 가이드] -> [의학적 근거] -> [영상 가이드] */}
            {selectedKeyword ? (
              <KeywordDetailView
                condition={selectedCondition}
                keyword={selectedKeyword}
              />
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">
                  상단의 세부 건강관리 키워드(태그)를 선택하시면 행동 가이드, 의학적 근거, 영상이 표시됩니다.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-700">
                메디케어온 (Medicare On)
              </p>
              <p>일반건강검진 사후관리 및 생활습관 교정 프로토타입</p>
            </div>
          </div>

          <div className="max-w-xl text-slate-400 leading-relaxed text-[11px]">
            * 본 서비스는 일반건강검진 사후관리를 돕기 위한 보조 프로토타입이며, 실제 진단 및 약물 치료 처방은 의사와의 상담을 통해 결정되어야 합니다.
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span className="hover:text-teal-600 cursor-pointer">이용약관</span>
            <span>·</span>
            <span className="hover:text-teal-600 cursor-pointer">개인정보처리방침</span>
            <span>·</span>
            <span className="hover:text-teal-600 cursor-pointer">학술출처안내</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
