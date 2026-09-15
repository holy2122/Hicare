import React, { useEffect, useMemo, useState } from "react";
import { HealthCondition, HealthKeywordTopic, loadHealthConditions } from "../data/healthData";
import { Navbar } from "../components/Navbar";
import { ConditionCard } from "../components/ConditionCard";
import { KeywordTagBar } from "../components/KeywordTagBar";
import { KeywordDetailView } from "../components/KeywordDetailView";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";

const CATEGORY_TABS = [
  { id: "ALL", label: "전체" },
  { id: "심뇌혈관", label: "심뇌혈관" },
  { id: "내분비", label: "내분비·대사" },
  { id: "소화기", label: "소화기" },
  { id: "신장", label: "신장" },
  { id: "호흡기", label: "호흡기" },
];

function ListView({
  conditions,
  onSelectCondition,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
}: {
  conditions: HealthCondition[];
  onSelectCondition: (condition: HealthCondition) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
}) {
  const filteredConditions = useMemo(() => {
    return conditions.filter((item) => {
      const matchCategory = categoryFilter === "ALL" || item.category.includes(categoryFilter);
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchCategory;
      const matchesSearch = [
        item.name,
        item.englishName,
        item.shortDesc,
        ...item.keywords.flatMap((keyword) => [keyword.tag, keyword.title]),
      ].some((value) => value.toLowerCase().includes(q));
      return matchCategory && matchesSearch;
    });
  }, [categoryFilter, conditions, searchQuery]);

  return (
    <>
      <Navbar
        onReset={() => {
          setSearchQuery("");
          setCategoryFilter("ALL");
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedConditionId={null}
      />
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
        <section className="max-w-3xl mb-7 sm:mb-9">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-800 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            질환별 맞춤 건강관리
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            <>
              5대 질환 중 선택!
              <br />
              건강관리법 확인!
            </>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-slate-600">
            질환을 선택하면 해당 질환의 기준 설명과 생활관리 키워드, 근거 기반 가이드가 한 화면에 순서대로 열립니다.
          </p>
        </section>

        <section aria-labelledby="condition-list-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <h2 id="condition-list-title" className="text-xl font-bold text-slate-900">5대 질환 목록</h2>
            </div>
            <div className="relative md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="질환 또는 관리법 검색"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-3 focus:ring-teal-500/15"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  categoryFilter === tab.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredConditions.map((condition) => (
              <ConditionCard
                key={condition.id}
                condition={condition}
                isSelected={false}
                onSelect={onSelectCondition}
              />
            ))}
          </div>

          {filteredConditions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Info className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              <p className="font-semibold text-slate-700">검색 결과가 없습니다.</p>
              <button onClick={() => setSearchQuery("")} className="mt-3 text-sm font-bold text-teal-700 underline cursor-pointer">검색 초기화</button>
            </div>
          )}
        </section>
      </main>
      <footer className="mt-auto border-t border-slate-200 bg-white/80 px-4 py-7 text-center text-[11px] leading-relaxed text-slate-400">
        본 서비스는 건강검진 사후관리를 돕기 위한 보조 프로토타입이며, 실제 진단과 치료는 의료진 상담을 통해 결정해야 합니다.
      </footer>
    </>
  );
}

function ConditionDetailView({
  condition,
  onBack,
}: {
  condition: HealthCondition;
  onBack: () => void;
}) {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const selectedKeyword = useMemo<HealthKeywordTopic | null>(() => {
    if (!selectedKeywordId) return null;
    return condition.keywords.find((keyword) => keyword.id === selectedKeywordId) || null;
  }, [condition, selectedKeywordId]);

  const handleSelectKeyword = (keyword: HealthKeywordTopic) => {
    setSelectedKeywordId(keyword.id);
    window.setTimeout(() => document.getElementById("final-guide")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <button onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-teal-700 cursor-pointer" aria-label="전체 질환 목록으로 돌아가기">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">전체 질환 보기</span>
            <span className="sm:hidden">목록</span>
          </button>
          <div className="flex items-center gap-2 text-right">
            <Activity className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-extrabold text-slate-900">{condition.name} 관리</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button onClick={onBack} className="text-teal-700 hover:underline cursor-pointer">8대 질환</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{condition.name}</span>
        </div>

        {/* STEP 1: disease criteria */}
        <section className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-700 to-cyan-700 p-5 text-white shadow-lg shadow-blue-700/15 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-extrabold">01</div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-100">Step 1</p>
              <h1 className="text-xl font-extrabold sm:text-2xl">{condition.name} 기준 설명</h1>
            </div>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-blue-50 sm:text-base">{condition.shortDesc}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-1 text-xs font-bold text-blue-100">정상 기준</p>
              <p className="text-sm font-semibold leading-relaxed">{condition.normalRangeLabel}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-1 text-xs font-bold text-blue-100">요관찰 기준</p>
              <p className="text-sm font-semibold leading-relaxed">{condition.observationThreshold}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/30 bg-amber-300/15 p-3 text-xs leading-relaxed text-blue-50">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            건강검진의 요관찰 표시는 생활습관을 점검하고 추적검사를 준비하는 단계입니다. 개인의 진단을 대신하지 않습니다.
          </div>
        </section>

        {/* STEP 2: keyword selection */}
        <section className="mb-8 scroll-mt-20" id="keyword-section">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-sm font-extrabold text-white">02</div>
            <h2 className="text-xl font-extrabold text-slate-900">나의 상태에 맞는 건강관리</h2>
          </div>
          <KeywordTagBar
            condition={condition}
            selectedKeywordId={selectedKeywordId}
            onSelectKeyword={handleSelectKeyword}
            onResetCondition={onBack}
          />
        </section>

        {/* Final guide only after keyword selection */}
        <section id="final-guide" className="scroll-mt-20">
          {selectedKeyword ? (
            <>
              <KeywordDetailView condition={condition} keyword={selectedKeyword} />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
              <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-teal-500" />
              <h3 className="mb-1 font-bold text-slate-900">키워드를 선택하면 상세 가이드가 열립니다</h3>
              <p className="text-sm text-slate-500">행동 가이드, 의학적 근거, 유튜브 영상이 선택한 주제에 맞춰 표시됩니다.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    const controller = new AbortController();
    loadHealthConditions(controller.signal)
      .then((data) => {
        setConditions(data);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "건강관리 데이터를 불러오지 못했습니다.");
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-sm font-semibold text-slate-600">건강관리 데이터를 불러오는 중입니다…</div>;
  }

  if (loadError) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 px-6 text-center"><div><p className="font-bold text-slate-900">데이터를 불러오지 못했습니다.</p><p className="mt-2 text-sm text-slate-500">{loadError}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white cursor-pointer">다시 시도</button></div></div>;
  }

  if (selectedCondition) {
    return <ConditionDetailView condition={selectedCondition} onBack={() => setSelectedCondition(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 gradient-mesh">
      <ListView
        conditions={conditions}
        onSelectCondition={setSelectedCondition}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />
    </div>
  );
}
