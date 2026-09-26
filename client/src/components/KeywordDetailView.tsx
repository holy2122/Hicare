import React, { useEffect, useState } from "react";
import { HealthCondition, HealthKeywordTopic } from "../data/healthData";
import {
  Compass,
  FileText,
  PlayCircle,
  ExternalLink,
  CheckCircle,
  Check,
  AlertCircle,
  Clock,
  Share2,
  Bookmark,
  Printer,
  ShieldCheck,
  Award,
  Video,
  Flame,
  ArrowRight,
  Dumbbell,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface KeywordDetailViewProps {
  condition: HealthCondition;
  keyword: HealthKeywordTopic;
  onReturnToViewedCondition: () => void;
}

export const KeywordDetailView: React.FC<KeywordDetailViewProps> = ({
  condition,
  keyword,
  onReturnToViewedCondition,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [timelineStart, setTimelineStart] = useState<number | undefined>(keyword.video.startSeconds);
  const [timelineAutoplay, setTimelineAutoplay] = useState(false);
  const [completedTimeline, setCompletedTimeline] = useState<number[]>([]);

  const timelineStorageKey = `hicare-timeline-${condition.id}-${keyword.id}`;
  const timelineItems = keyword.video.timeline ?? [];
  const timelineGroups = timelineItems.reduce<Array<{ title: string; items: typeof timelineItems }>>((groups, item) => {
    const title = item.section ?? "영상 타임라인";
    const existing = groups.find((group) => group.title === title);
    if (existing) existing.items.push(item);
    else groups.push({ title, items: [item] });
    return groups;
  }, []);
  const additionalVideos = keyword.additionalVideos ?? [];
  const additionalShorts = additionalVideos.filter((video) => video.format === "short");
  const additionalFullVideos = additionalVideos.filter((video) => video.format !== "short");
  const timelineProgress = timelineItems.length
    ? Math.round((completedTimeline.length / timelineItems.length) * 100)
    : 0;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(timelineStorageKey);
      setCompletedTimeline(saved ? JSON.parse(saved) : []);
    } catch {
      setCompletedTimeline([]);
    }
  }, [timelineStorageKey]);

  const toggleTimelineComplete = (seconds: number) => {
    setCompletedTimeline((previous) => {
      const next = previous.includes(seconds)
        ? previous.filter((value) => value !== seconds)
        : [...previous, seconds];
      window.localStorage.setItem(timelineStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("가이드 링크가 클립보드에 복사되었습니다.");
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? "북마크가 해제되었습니다." : "가이드가 보관함에 저장되었습니다.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-4 animate-in fade-in-50 duration-300 pb-16">
      {/* Detail Page Breadcrumb & Header Title */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200/60">
              {condition.name}
            </span>
            <span>&gt;</span>
            <span className="text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
              {keyword.tag}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                isBookmarked
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
              title="북마크"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
              <span className="hidden sm:inline">{isBookmarked ? "저장됨" : "저장"}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              title="공유"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">공유</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              title="인쇄"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">인쇄</span>
            </button>
          </div>
        </div>

        <h1 className="whitespace-pre-line text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {keyword.title}
        </h1>
        <p className="text-center text-base text-slate-600 font-medium leading-relaxed">
          {keyword.subtitle}
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. 실천 수칙 및 한 줄 요약 */}
      {/* ======================================================== */}
      <section className="order-2 bg-white rounded-2xl border-2 border-teal-500/80 shadow-md shadow-teal-500/5 overflow-hidden transition-all">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Compass className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">실천 수칙 및 한 줄 요약</h2>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
            오늘부터 바로 실천
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Highlight Callout Box: Short intuitive summary */}
          <div className="p-4 sm:p-5 rounded-xl bg-teal-50/70 border-l-4 border-teal-600 text-slate-800">
            <div className="flex items-start gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-teal-800 mb-1">
                  한 줄 핵심 실천 요약
                </h4>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  "{keyword.shortActionSummary}"
                </p>
              </div>
            </div>
          </div>

          {/* Action Steps Interactive Checklist */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              <span>단계별 세부 실천 순서</span>
              <span className="mt-1 block text-xs font-normal text-slate-500">
                완료한 항목을 클릭해 체크해보세요 ({completedSteps.length}/{keyword.actionSteps.length})
              </span>
            </h4>

            <div className="grid gap-3 sm:grid-cols-1">
              {keyword.actionSteps.map((step, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isDone
                        ? "bg-slate-50 border-teal-300 text-slate-400"
                        : "bg-white border-slate-200/90 hover:border-teal-400 hover:shadow-xs"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                        isDone
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 text-transparent group-hover:border-teal-500"
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <span
                          className="font-bold text-base sm:text-lg text-slate-900"
                        >
                          {step.title}
                        </span>
                        {step.metric && (
                          <span className="px-2 py-0.5 rounded-md text-sm font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200/60">
                            {step.metric}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm sm:text-base leading-relaxed text-slate-600"
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Safety Rules */}
          {keyword.keyRules && keyword.keyRules.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-sm sm:text-base">
              <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>안전 주의사항</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-900/90">
                {keyword.keyRules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. 학술 논문 및 근거 */}
      {/* ======================================================== */}
      <section className="order-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">학술 논문 및 근거</h2>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>근거중심의학 (EBM)</span>
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {/* Paper Meta Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {keyword.evidence.journal} ({keyword.evidence.year})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                {keyword.evidence.evidenceGrade}
              </span>
              {keyword.evidence.sampleSizeOrMethod && (
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200 text-slate-700">
                  {keyword.evidence.sampleSizeOrMethod}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-1">
              {keyword.evidence.paperTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              저자: {keyword.evidence.authors}
            </p>

            {/* Core Summary Callout */}
            <div className="p-3 rounded-lg bg-white border border-blue-200/70 text-slate-800 shadow-2xs">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>논문 핵심 요약문 (Clinical Findings)</span>
              </h4>
              <p className="text-sm leading-relaxed text-slate-700">
                {keyword.evidence.coreSummary}
              </p>
            </div>
          </div>

          {/* Hyperlink Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="text-xs text-slate-500">
              * 학술 출처는 PubMed, NEJM, Lancet, 대한의학회 공인 학술지 등 공신력 있는 임상 데이터를 기준으로 추출되었습니다.
            </div>

            <a
              href={keyword.evidence.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
            >
              <span>원문 논문 및 학술 출처 확인</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. 영상 시청 및 따라 하기 */}
      {/* ======================================================== */}
      <section className="order-1 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-teal-800 via-cyan-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Video className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">시청하고 직접 따라하기</h2>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
            <PlayCircle className="w-3.5 h-3.5 text-teal-300" />
            <span>플레이어 임베드</span>
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Video Meta Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {keyword.video.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                제공: {keyword.video.channel}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {keyword.video.duration}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                권장: {keyword.video.targetTimePerDay}
              </span>
            </div>
          </div>

          {/* Embedded YouTube Player Container */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${keyword.video.youtubeId}?rel=0&modestbranding=1${timelineStart ? `&start=${timelineStart}` : ""}${timelineAutoplay ? "&autoplay=1" : ""}`}
              title={keyword.video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          {timelineItems.length ? (
            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-extrabold text-teal-900">
                  <Clock className="h-4 w-4 text-teal-600" />
                  영상 타임라인
                </div>
                <span className="font-semibold text-teal-700">
                  시청 완료 {completedTimeline.length}/{timelineItems.length} ({timelineProgress}%)
                </span>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/80" aria-label={`영상 시청 진행률 ${timelineProgress}%`}>
                <div className="h-full rounded-full bg-teal-500 transition-all duration-300" style={{ width: `${timelineProgress}%` }} />
              </div>
              <p className="mb-2 text-xs text-teal-700">시간을 누르면 해당 구간부터 재생됩니다. 시청을 마친 뒤 체크하세요.</p>
              <div className="space-y-3">
                {timelineGroups.map((group) => (
                  <div key={group.title} className="rounded-lg border border-teal-100 bg-white/70 p-2.5">
                    <h4 className="mb-2 text-xs font-extrabold text-teal-900">{group.title}</h4>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {group.items.map((item) => {
                        const isTimelineDone = completedTimeline.includes(item.seconds);
                        return (
                          <button
                            key={`${item.seconds}-${item.label}`}
                            type="button"
                            onClick={() => {
                              setTimelineStart(item.seconds);
                              setTimelineAutoplay(true);
                            }}
                            className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs shadow-sm transition active:scale-[0.99] ${
                              isTimelineDone
                                ? "border-teal-300 bg-teal-100/80 text-teal-900"
                                : "border-white/80 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-800"
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isTimelineDone ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-transparent"}`}>
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                            <span className="shrink-0 rounded-md bg-teal-100 px-1.5 py-0.5 font-bold tabular-nums text-teal-800">{item.time}</span>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            <span
                              role="checkbox"
                              aria-checked={isTimelineDone}
                              aria-label={`${item.label} 시청 완료 표시`}
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleTimelineComplete(item.seconds);
                              }}
                              className="shrink-0 rounded-md px-1.5 py-1 font-semibold text-teal-700 hover:bg-white"
                            >
                              {isTimelineDone ? "완료" : "체크"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Video Summary Description */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <PlayCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-0.5">
                영상 시청 포인트 & 홈트 요약
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {keyword.video.summary}
              </p>
            </div>
          </div>

          {additionalFullVideos.map((video) => (
            <div key={video.youtubeId} className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{video.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">제공: {video.channel}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" />{video.duration}</span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">권장: {video.targetTimePerDay}</span>
                </div>
              </div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1${video.startSeconds ? `&start=${video.startSeconds}` : ""}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <PlayCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-0.5">추가 영상 안내</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{video.summary}</p>
                  {video.keyPoints?.length ? (
                    <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                      {video.keyPoints.slice(0, 3).map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed text-slate-700">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {additionalShorts.length ? (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">짧게 따라 하는 운동 영상</h3>
                <p className="mt-1 text-xs text-slate-500">두 영상을 한 카드에서 나란히 확인해 보세요.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-3 sm:gap-4 sm:p-4">
                {additionalShorts.map((video) => (
                  <div key={video.youtubeId} className="min-w-0 rounded-xl border border-white bg-white p-2 shadow-sm sm:p-3">
                    <h4 className="mb-2 line-clamp-2 min-h-8 text-xs font-bold leading-snug text-slate-900 sm:text-sm">{video.title}</h4>
                    <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-slate-900">
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-600 sm:text-xs">{video.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="order-4 flex justify-center">
        <button
          onClick={onReturnToViewedCondition}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-300 bg-white px-5 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:border-teal-500 hover:bg-teal-50 cursor-pointer"
        >
          다른 질환 선택하기
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Completion & Next Action Banner */}
      <div className="order-5 -mt-2 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-2xl border border-teal-200 p-4 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-full">
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            오늘의 {keyword.tag} 가이드 확인했나요?
          </h4>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            꾸준한 4주간의 생활습관 개선으로<br />
            Body Up! 건강 Up!
          </p>
        </div>
        <button
          onClick={() => {
            setShowCompletionModal(true);
            toast.success("건강관리 실천 다이어리에 기록되었습니다.");
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer shrink-0 transition-transform hover:scale-[1.02]"
        >
          <span>오늘 실천 완료 체크</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showCompletionModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="completion-title">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-teal-200 bg-white p-6 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <button onClick={() => setShowCompletionModal(false)} className="absolute right-3 top-3 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" aria-label="팝업 닫기"><X className="h-5 w-5" /></button>
            <div className="mb-3 flex justify-center gap-1.5" aria-label={`완료한 실천 ${completedSteps.length}개`}>
              {keyword.actionSteps.map((_, index) => (
                <span key={index} className={`grid h-10 w-10 place-items-center rounded-full border-2 text-lg transition-all duration-300 ${completedSteps.includes(index) ? "scale-110 border-amber-400 bg-amber-100 animate-bounce" : "border-slate-200 bg-slate-50 grayscale opacity-40"}`}>🏅</span>
              ))}
            </div>
            {completedSteps.length === keyword.actionSteps.length ? (
              <>
                <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700 animate-pulse"><Dumbbell className="h-10 w-10" /></div>
                <h2 id="completion-title" className="text-lg font-extrabold leading-relaxed text-slate-900">오늘도 정말 고생 많으셨어요! 👏<br />꾸준한 노력이 건강한 내일을 만듭니다! 💪</h2>
                <p className="mt-3 text-base font-extrabold text-teal-700">🎉 나의 건강관리 Level Up 완료! 🎉</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-500"><span className="text-3xl">👏</span></div>
                <h2 id="completion-title" className="text-lg font-extrabold text-slate-900">참 잘했어요!</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">오늘 {completedSteps.length}개 항목을 완료했어요. 남은 실천도 천천히 이어가 보세요.</p>
              </>
            )}
            <button onClick={() => setShowCompletionModal(false)} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 cursor-pointer">확인</button>
          </div>
        </div>
      )}
    </div>
  );
};
