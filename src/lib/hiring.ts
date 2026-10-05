import { supabase } from "@/integrations/supabase/client";

/** Applicant pipeline, in policy order. */
export const APPLICATION_STAGES = [
  "new",
  "screening",
  "shortlisted",
  "interview",
  "assessment",
  "reference_check",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
] as const;

export const ACTIVE_STAGES = APPLICATION_STAGES.filter(
  (s) => !["hired", "rejected", "withdrawn"].includes(s),
);

export const POSTING_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "published",
  "closed",
  "archived",
] as const;

export const REVIEW_STAGES = ["shortlist", "interview", "assessment", "final"] as const;

/** Standardised 1–5 rating scale used everywhere a reviewer scores a candidate. */
export const RATING_SCALE = [
  { value: 1, label: "Poor" },
  { value: 2, label: "Below expectations" },
  { value: 3, label: "Meets expectations" },
  { value: 4, label: "Strong" },
  { value: 5, label: "Outstanding" },
] as const;

export const RATING_MAX = 5;

export const ratingLabel = (value: number) =>
  RATING_SCALE.find((r) => r.value === Math.round(value))?.label ?? "—";

export type ScoreRow = {
  id?: string;
  criterion: string;
  stage: string;
  score: number;
  max_score: number;
  weight: number;
  notes?: string | null;
  reviewer_name?: string | null;
  created_at?: string;
};

/** Weighted percentage across a set of scores (0–100). */
export const weightedPercent = (scores: ScoreRow[]) => {
  if (!scores.length) return 0;
  const totalWeight = scores.reduce((s, r) => s + Number(r.weight || 1), 0) || 1;
  const earned = scores.reduce(
    (s, r) => s + (Number(r.score) / Number(r.max_score || RATING_MAX)) * Number(r.weight || 1),
    0,
  );
  return (earned / totalWeight) * 100;
};

/** Average rating on the 1–5 scale. */
export const averageRating = (scores: ScoreRow[]) =>
  scores.length ? (weightedPercent(scores) / 100) * RATING_MAX : 0;

export const recommendationFor = (percent: number) => {
  if (percent >= 80) return { label: "Strongly recommend", tone: "default" as const };
  if (percent >= 65) return { label: "Recommend", tone: "secondary" as const };
  if (percent >= 50) return { label: "Consider", tone: "outline" as const };
  return { label: "Not recommended", tone: "destructive" as const };
};

export type ScoringTemplate = {
  id: string;
  name: string;
  stage: string;
  criteria: { criterion: string; weight?: number }[];
};

export const loadScoringTemplates = async (): Promise<ScoringTemplate[]> => {
  const { data } = await supabase
    .from("scoring_templates")
    .select("id, name, stage, criteria")
    .order("name");
  return (data || []).map((t: any) => ({
    ...t,
    criteria: Array.isArray(t.criteria) ? t.criteria : [],
  }));
};

/** Manual audit entry for actions that aren't a plain row change. */
export const logHiringEvent = async (
  entity_type: string,
  entity_id: string | null,
  action: string,
  payload: Record<string, unknown> = {},
) => {
  await supabase.from("recruitment_audit_log").insert({
    entity_type,
    entity_id,
    action,
    payload: payload as any,
  });
};

export const prettify = (s?: string | null) => (s ? s.replace(/_/g, " ") : "—");