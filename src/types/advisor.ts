export type CareerGoal = "get_job" | "switch_careers" | "upskill" | "start_business" | "freelance";
export type InterestArea = "tech_dev" | "design" | "marketing" | "data_ai" | "business" | "agriculture" | "other";
export type SkillLevel = "never_worked_in_field" | "some_self_taught" | "done_it_professionally";
export type TimeCommitment = "under_5hrs" | "five_to_15hrs" | "full_time";
export type FundingSituation = "self_funding" | "employer_paying" | "need_scholarship" | "not_sure";
export type Urgency = "3_months" | "6_months" | "1_year" | "just_exploring";

export interface AdvisorAnswers {
  career_goal: CareerGoal;
  interest_area: InterestArea;
  interest_area_freetext?: string;
  skill_level: SkillLevel;
  time_commitment: TimeCommitment;
  funding_situation: FundingSituation;
  urgency: Urgency;
  freetext_context?: string;
}

export interface AdvisorProductBrief {
  slug: string;
  name: string;
  category: string;
  price_ugx: number;
  price_usd: number;
  duration?: string | null;
  next_cohort_start?: string | null;
  description?: string | null;
  thinkific_description?: string;
  enrolled_student_count?: number;
}

export interface RecommendationPrimary {
  product_slug: string;
  fit_score: number;
  headline: string;
  reasoning: string;
  outcomes: string[];
  honest_caveat: string;
}

export interface RecommendationAlternative {
  product_slug: string;
  fit_score: number;
  vs_primary: string;
  best_for: string;
}

export interface PathwayStep {
  month: number;
  product_slug: string | null;
  milestone: string;
  is_target: boolean;
}

export interface Recommendation {
  primary: RecommendationPrimary;
  alternatives: RecommendationAlternative[];
  pathway: PathwayStep[];
  summary: string;
  no_strong_match: boolean;
  no_match_guidance: string | null;
}

export interface RecommendResponse {
  recommendation: Recommendation;
  products: Record<string, AdvisorProductBrief>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}