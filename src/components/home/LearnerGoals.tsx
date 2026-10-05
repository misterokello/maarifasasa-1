import React from "react";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEARNER_GOALS, useLearnerGoals, type LearnerGoalId } from "@/lib/learnerPreferences";
import { track, trackFunnelStep } from "@/lib/analytics";

/**
 * Lightweight preferences step: visitors pick their goals and the featured
 * courses / pathway emphasis below reorder around them.
 */
const LearnerGoals = () => {
  const [goals, setGoals] = useLearnerGoals();

  const toggle = (id: LearnerGoalId) => {
    const next = goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id];
    setGoals(next);
    track("learner_goal_toggle", { goal: id, selected: !goals.includes(id), goals: next });
    if (next.length > 0) trackFunnelStep("learner_goals_selected", { goals: next });
  };

  const clear = () => {
    setGoals([]);
    track("learner_goals_cleared");
  };

  return (
    <section className="border-y border-border bg-background py-12" id="learner-goals">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" /> Personalise your path
          </p>
          <h2 className="heading-sm">What do you want to achieve?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick one or more goals — we&apos;ll reorder the programmes below to match.
          </p>
        </div>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-3">
          {LEARNER_GOALS.map((goal) => {
            const selected = goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggle(goal.id)}
                aria-pressed={selected}
                className={`group flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
                title={goal.description}
              >
                {selected && <Check className="h-4 w-4" />}
                {goal.label}
              </button>
            );
          })}
        </div>

        {goals.length > 0 && (
          <div className="mt-5 flex justify-center">
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="mr-1 h-4 w-4" /> Clear preferences
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LearnerGoals;
