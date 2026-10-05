export type FieldDef = {
  id: string;
  key: string;
  label: string;
  section: string;
  input_type: string;
  options: string[] | null;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  visible: boolean;
  sort_order: number;
};

export const SECTION_ORDER = ["personal", "professional", "learning", "demographics", "marketing"] as const;

export const SECTION_TITLE: Record<string, { title: string; subtitle: string }> = {
  personal: { title: "About you", subtitle: "The basics we need to set up your account." },
  professional: { title: "Your work & education", subtitle: "Helps us match you with the right programs." },
  learning: { title: "Your learning goals", subtitle: "We use this to personalise recommendations." },
  demographics: { title: "Optional — a bit more about you", subtitle: "Used for scholarships and reporting. All optional." },
  marketing: { title: "Almost done", subtitle: "How did you find us?" },
};

export const DEFAULT_ONBOARDING_FIELDS: FieldDef[] = [
  { id: "default-first-name", key: "first_name", label: "First name", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: true, visible: true, sort_order: 10 },
  { id: "default-last-name", key: "last_name", label: "Last name", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: true, visible: true, sort_order: 20 },
  { id: "default-preferred-name", key: "preferred_name", label: "Preferred name", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 30 },
  { id: "default-phone", key: "phone", label: "Phone / WhatsApp", section: "personal", input_type: "tel", options: [], placeholder: "", help_text: null, required: true, visible: true, sort_order: 40 },
  { id: "default-country", key: "country", label: "Country", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: true, visible: true, sort_order: 50 },
  { id: "default-district", key: "district", label: "District", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 60 },
  { id: "default-city", key: "city", label: "City", section: "personal", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 70 },
  { id: "default-employment-status", key: "employment_status", label: "Employment status", section: "professional", input_type: "select", options: ["Student", "Employed", "Self-employed", "Unemployed", "Other"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 10 },
  { id: "default-occupation", key: "occupation", label: "Occupation", section: "professional", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 20 },
  { id: "default-employer", key: "employer", label: "Employer", section: "professional", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 30 },
  { id: "default-years-experience", key: "years_experience", label: "Years of experience", section: "professional", input_type: "select", options: ["0-1", "2-4", "5-9", "10+"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 40 },
  { id: "default-highest-education", key: "highest_education", label: "Highest education", section: "professional", input_type: "select", options: ["Primary", "Secondary", "Certificate", "Diploma", "Degree", "Postgraduate", "Other"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 50 },
  { id: "default-linkedin-url", key: "linkedin_url", label: "LinkedIn profile", section: "professional", input_type: "url", options: [], placeholder: "https://linkedin.com/in/...", help_text: null, required: false, visible: true, sort_order: 60 },
  { id: "default-cv-url", key: "cv_url", label: "CV / Resume", section: "professional", input_type: "file", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 70 },
  { id: "default-career-interests", key: "career_interests", label: "Career interests", section: "learning", input_type: "multiselect", options: ["Digital marketing", "Data", "AI tools", "Sales", "Customer support", "Entrepreneurship"], placeholder: "", help_text: null, required: false, visible: true, sort_order: 10 },
  { id: "default-current-skill-level", key: "current_skill_level", label: "Current skill level", section: "learning", input_type: "select", options: ["Beginner", "Intermediate", "Advanced"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 20 },
  { id: "default-desired-career-path", key: "desired_career_path", label: "Desired career path", section: "learning", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 30 },
  { id: "default-learning-goals", key: "learning_goals", label: "Learning goals", section: "learning", input_type: "textarea", options: [], placeholder: "What do you want to achieve?", help_text: null, required: false, visible: true, sort_order: 40 },
  { id: "default-preferred-schedule", key: "preferred_schedule", label: "Preferred schedule", section: "learning", input_type: "select", options: ["Weekdays", "Weekends", "Evenings", "Flexible"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 50 },
  { id: "default-age-range", key: "age_range", label: "Age range", section: "demographics", input_type: "select", options: ["Under 18", "18-24", "25-34", "35-44", "45+"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 10 },
  { id: "default-gender", key: "gender", label: "Gender", section: "demographics", input_type: "select", options: ["Female", "Male", "Non-binary", "Prefer not to say"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 20 },
  { id: "default-disability-status", key: "disability_status", label: "Disability status", section: "demographics", input_type: "select", options: ["Yes", "No", "Prefer not to say"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 30 },
  { id: "default-refugee-status", key: "refugee_status", label: "Refugee status", section: "demographics", input_type: "select", options: ["Yes", "No", "Prefer not to say"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 40 },
  { id: "default-preferred-language", key: "preferred_language", label: "Preferred language", section: "demographics", input_type: "select", options: ["English", "Luganda", "Swahili", "French", "Other"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 50 },
  { id: "default-referral-source", key: "referral_source", label: "How did you hear about us?", section: "marketing", input_type: "select", options: ["Friend", "WhatsApp", "Facebook", "LinkedIn", "Google", "Event", "Other"], placeholder: "Select...", help_text: null, required: false, visible: true, sort_order: 10 },
  { id: "default-scholarship-program", key: "scholarship_program", label: "Scholarship program", section: "marketing", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 20 },
  { id: "default-promo-code", key: "promo_code", label: "Promo code", section: "marketing", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 30 },
  { id: "default-organization", key: "organization", label: "Organization", section: "marketing", input_type: "text", options: [], placeholder: "", help_text: null, required: false, visible: true, sort_order: 40 },
  { id: "default-marketing-consent", key: "marketing_consent", label: "I agree to receive updates", section: "marketing", input_type: "checkbox", options: [], placeholder: "", help_text: "I agree to receive updates", required: false, visible: true, sort_order: 50 },
];

export const PROFILE_COLUMN_KEYS = new Set([
  "onboarding_responses",
  "avatar_url",
  "bio",
  "phone",
  "location",
  "job_title",
  "company",
  "website",
  "linkedin_url",
  "github_url",
  "twitter_url",
  "learning_goals",
  "skills",
  "interests",
  "notification_preferences",
  "privacy_settings",
  "first_name",
  "last_name",
  "preferred_name",
  "country",
  "district",
  "city",
  "employment_status",
  "occupation",
  "employer",
  "years_experience",
  "highest_education",
  "cv_url",
  "career_interests",
  "current_skill_level",
  "desired_career_path",
  "preferred_schedule",
  "age_range",
  "gender",
  "disability_status",
  "refugee_status",
  "preferred_language",
  "referral_source",
  "scholarship_program",
  "promo_code",
  "organization",
  "marketing_consent",
]);

// Columns stored as text[] in the profiles table. Sending a plain string to these
// causes Postgres "malformed array literal" errors, so values must be coerced.
export const ARRAY_PROFILE_COLUMNS = new Set([
  "learning_goals",
  "skills",
  "interests",
  "career_interests",
]);

export const BOOLEAN_PROFILE_COLUMNS = new Set(["marketing_consent"]);

export const toArrayValue = (v: any): string[] => {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((x) => x.trim() !== "");
  const s = String(v).trim();
  if (!s) return [];
  return s.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
};

/** Coerce an onboarding form value into the shape the profiles column expects. */
export const coerceProfileValue = (key: string, value: any) => {
  if (ARRAY_PROFILE_COLUMNS.has(key)) return toArrayValue(value);
  if (BOOLEAN_PROFILE_COLUMNS.has(key)) return !!value;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

/** Turn a stored profile value back into something an input can display. */
export const displayFieldValue = (f: FieldDef, value: any) => {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value) && f.input_type !== "multiselect") {
    return value.join(f.input_type === "textarea" ? "\n" : ", ");
  }
  if (!Array.isArray(value) && f.input_type === "multiselect") return toArrayValue(value);
  return value;
};

export const normalizeFieldDefinitions = (defs: any[] | null | undefined): FieldDef[] => {
  const normalized = (defs || []).map((d: any) => ({
    ...d,
    options: Array.isArray(d.options) ? d.options : d.options ? JSON.parse(JSON.stringify(d.options)) : [],
  })) as FieldDef[];

  return normalized.length ? normalized : DEFAULT_ONBOARDING_FIELDS;
};

/* ------------------------------------------------------------------ */
/* Validation + progress helpers                                       */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,19}$/;

/** True when a stored/form value counts as "answered". */
export const isFieldFilled = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.filter((v) => String(v).trim() !== "").length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return String(value).trim() !== "";
};

/** Per-field validation used by the onboarding wizard. Returns an error string or null. */
export const validateFieldValue = (f: FieldDef, value: any): string | null => {
  const filled = isFieldFilled(value);
  if (!filled) return f.required ? `${f.label} is required` : null;

  if (ARRAY_PROFILE_COLUMNS.has(f.key)) {
    const arr = toArrayValue(value);
    if (f.required && arr.length === 0) return `${f.label} is required`;
    if (arr.some((v) => v.length > 200)) return `${f.label}: each entry must be under 200 characters`;
    return null;
  }

  const str = typeof value === "string" ? value.trim() : "";

  switch (f.input_type) {
    case "email":
      if (!EMAIL_RE.test(str)) return `${f.label} must be a valid email address`;
      break;
    case "tel":
      if (!PHONE_RE.test(str)) return `${f.label} must be a valid phone number`;
      break;
    case "url":
      try {
        const u = new URL(str.startsWith("http") ? str : `https://${str}`);
        if (!u.hostname.includes(".")) return `${f.label} must be a valid URL`;
      } catch {
        return `${f.label} must be a valid URL`;
      }
      break;
    case "select":
      if (Array.isArray(f.options) && f.options.length && !f.options.map(String).includes(str)) {
        return `${f.label}: please choose one of the listed options`;
      }
      break;
    case "multiselect": {
      const arr = toArrayValue(value);
      if (Array.isArray(f.options) && f.options.length) {
        const allowed = f.options.map(String);
        if (arr.some((v) => !allowed.includes(v))) return `${f.label}: contains an unsupported option`;
      }
      break;
    }
    case "textarea":
      if (str.length > 2000) return `${f.label} must be under 2000 characters`;
      break;
    default:
      if (str.length > 255) return `${f.label} must be under 255 characters`;
  }
  return null;
};

/** Validate a whole set of values. Returns the first error, or null. */
export const validateFields = (fields: FieldDef[], values: Record<string, any>): string | null => {
  for (const f of fields) {
    const err = validateFieldValue(f, values[f.key]);
    if (err) return err;
  }
  return null;
};

export type OnboardingProgress = {
  percent: number;
  completed: number;
  total: number;
  missingRequired: string[];
  isComplete: boolean;
};

/**
 * Progress across every visible field, with required fields weighted double so
 * the bar reflects what actually blocks completion.
 */
export const computeOnboardingProgress = (
  fields: FieldDef[],
  profile: any,
): OnboardingProgress => {
  const visible = (fields || []).filter((f) => f.visible !== false);
  const responses = (profile?.onboarding_responses || {}) as Record<string, any>;

  let earned = 0;
  let possible = 0;
  let completed = 0;
  const missingRequired: string[] = [];

  for (const f of visible) {
    const weight = f.required ? 2 : 1;
    possible += weight;
    const raw = profile?.[f.key] ?? responses[f.key];
    if (isFieldFilled(raw)) {
      earned += weight;
      completed += 1;
    } else if (f.required) {
      missingRequired.push(f.label);
    }
  }

  const percent = possible === 0 ? 100 : Math.min(100, Math.round((earned / possible) * 100));
  return {
    percent,
    completed,
    total: visible.length,
    missingRequired,
    isComplete: percent === 100,
  };
};