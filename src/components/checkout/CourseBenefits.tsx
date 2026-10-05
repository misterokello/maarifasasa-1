import { Sparkles, CheckCircle2, GraduationCap, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CourseBenefitsProps {
  description?: string | null;
  cardText?: string | null;
  keywords?: string | null;
  instructionalLevel?: string | null;
  duration?: string | null;
  totalLessons?: number;
}

/**
 * Extracts bullet points from rich HTML description by pulling <li> text.
 * Returns up to 8 concise items.
 */
function htmlToText(html: string): string {
  if (typeof window === "undefined") return "";
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function extractHighlights(html: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const items = Array.from(doc.querySelectorAll("li"))
      .map((li) => (li.textContent || "").trim().replace(/\s+/g, " "))
      .filter((t) => t.length > 0 && t.length < 220);
    // De-duplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const t of items) {
      if (!seen.has(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        unique.push(t);
      }
    }
    return unique.slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Split a plain-text blob into sentence-like fragments suitable for bullets.
 */
function splitSentences(text: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25 && s.length <= 220);
}

function deriveHighlightsFromText(text: string, skip?: string): string[] {
  const sentences = splitSentences(text);
  const skipNorm = (skip || "").trim().toLowerCase();
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of sentences) {
    const key = s.toLowerCase();
    if (key === skipNorm) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(s);
    if (result.length >= 5) break;
  }
  return result;
}

function deriveSummary(text: string): string {
  if (!text) return "";
  const firstStop = text.search(/[.!?]\s/);
  const first = firstStop > 0 ? text.slice(0, firstStop + 1) : text;
  if (first.length <= 240) return first.trim();
  return first.slice(0, 237).trimEnd() + "…";
}

function parseKeywords(keywords?: string | null): string[] {
  if (!keywords) return [];
  return keywords
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function CourseBenefits({
  description,
  cardText,
  keywords,
  instructionalLevel,
  duration,
  totalLessons,
}: CourseBenefitsProps) {
  const plainText = description ? htmlToText(description) : "";
  let highlights = description ? extractHighlights(description) : [];
  const summary = (cardText || "").trim() || deriveSummary(plainText);
  if (highlights.length === 0 && plainText) {
    highlights = deriveHighlightsFromText(plainText, summary);
  }
  const kw = parseKeywords(keywords);

  const facts: { icon: typeof GraduationCap; label: string }[] = [];
  if (instructionalLevel) facts.push({ icon: GraduationCap, label: instructionalLevel });
  if (duration) facts.push({ icon: Clock, label: duration });
  if (totalLessons && totalLessons > 0)
    facts.push({ icon: BookOpen, label: `${totalLessons} lessons` });

  const hasAnything = highlights.length > 0 || kw.length > 0 || summary || facts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="space-y-4 rounded-lg border bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">What you'll get</h3>
      </div>

      {summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
      )}

      {facts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {facts.map((f, i) => {
            const Icon = f.icon;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium border"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {f.label}
              </span>
            );
          })}
        </div>
      )}

      {highlights.length > 0 && (
        <ul className="space-y-2">
          {highlights.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {kw.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {kw.map((k, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal">
              {k}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}