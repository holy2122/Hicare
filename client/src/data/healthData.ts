export interface ActionGuideStep {
  title: string;
  desc: string;
  metric?: string;
}

export interface MedicalEvidence {
  paperTitle: string;
  journal: string;
  year: number;
  authors: string;
  coreSummary: string;
  sourceUrl: string;
  evidenceGrade: string;
  sampleSizeOrMethod?: string;
}

export interface VideoTimelineItem {
  label: string;
  time: string;
  seconds: number;
}

export interface VideoGuide {
  title: string;
  channel: string;
  youtubeId: string;
  format?: "full" | "short";
  startSeconds?: number;
  duration: string;
  summary: string;
  difficulty: "초급" | "중급" | "고급";
  targetTimePerDay: string;
  keyPoints?: string[];
  timeline?: VideoTimelineItem[];
}

export interface HealthKeywordTopic {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  shortActionSummary: string;
  actionSteps: ActionGuideStep[];
  keyRules: string[];
  evidence: MedicalEvidence;
  video: VideoGuide;
  additionalVideos?: VideoGuide[];
}

export interface HealthCondition {
  id: string;
  name: string;
  shortDesc: string;
  category: string;
  badge: string;
  normalRangeLabel: string;
  observationThreshold: string;
  urgency: "관리필요" | "주의요망" | "적극개선";
  colorTone: {
    primary: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
  };
  keywords: HealthKeywordTopic[];
}

export const HEALTH_DATA_URL = "/healthData.json";

export async function loadHealthConditions(signal?: AbortSignal): Promise<HealthCondition[]> {
  const response = await fetch(`${HEALTH_DATA_URL}?v=${Date.now()}`, { signal, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`건강관리 데이터 로딩 실패: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length !== 8) {
    throw new Error("healthData.json은 8개의 질환 데이터를 포함해야 합니다.");
  }

  return data as HealthCondition[];
}
