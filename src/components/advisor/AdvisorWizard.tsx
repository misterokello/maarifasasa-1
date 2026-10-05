import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdvisorAnswers } from "@/types/advisor";
import { cn } from "@/lib/utils";
import { trackAdvisor } from "@/lib/advisor/analytics";

interface Props {
  onComplete: (answers: AdvisorAnswers) => void;
  onCancel: () => void;
}

type Option = { value: string; label: string; description?: string };

const STEPS: Array<{
  key: keyof AdvisorAnswers;
  question: string;
  helper?: string;
  options: Option[];
}> = [
  {
    key: "career_goal",
    question: "What's your primary career goal right now?",
    helper: "Pick the one that fits best — you can refine later.",
    options: [
      { value: "get_job", label: "Get my first job in tech", description: "Land a role in the digital economy" },
      { value: "switch_careers", label: "Switch careers", description: "Move from my current field into a new one" },
      { value: "upskill", label: "Upskill in my current job", description: "Add a specific skill to grow where I am" },
      { value: "start_business", label: "Start a business", description: "Build something of my own" },
      { value: "freelance", label: "Earn freelance income", description: "Work for myself, project to project" },
    ],
  },
  {
    key: "interest_area",
    question: "Which area interests you most?",
    options: [
      { value: "tech_dev", label: "Tech / Software development" },
      { value: "design", label: "Design (UI/UX, Graphic)" },
      { value: "marketing", label: "Digital marketing" },
      { value: "data_ai", label: "Data & AI" },
      { value: "business", label: "Business & entrepreneurship" },
      { value: "agriculture", label: "Agribusiness" },
      { value: "other", label: "Something else / not sure" },
    ],
  },
  {
    key: "skill_level",
    question: "How much experience do you have in that area?",
    options: [
      { value: "never_worked_in_field", label: "Complete beginner", description: "I've never worked in this field" },
      { value: "some_self_taught", label: "Some self-taught knowledge", description: "I've explored it on my own or via short courses" },
      { value: "done_it_professionally", label: "Done it professionally", description: "I've worked in or near this field before" },
    ],
  },
  {
    key: "time_commitment",
    question: "How much time can you realistically commit each week?",
    helper: "Be honest — over-committing usually means dropping out.",
    options: [
      { value: "under_5hrs", label: "Under 5 hours", description: "Evenings or weekends only" },
      { value: "five_to_15hrs", label: "5–15 hours", description: "A serious side commitment" },
      { value: "full_time", label: "Full-time (30+ hrs)", description: "I can go all-in" },
    ],
  },
  {
    key: "funding_situation",
    question: "How will you fund this?",
    options: [
      { value: "self_funding", label: "I'm paying myself" },
      { value: "employer_paying", label: "My employer is paying" },
      { value: "need_scholarship", label: "I need a scholarship or payment plan" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
  {
    key: "urgency",
    question: "When do you want to see results?",
    options: [
      { value: "3_months", label: "Within 3 months", description: "Urgent — I need outcomes fast" },
      { value: "6_months", label: "Within 6 months", description: "Focused but realistic" },
      { value: "1_year", label: "Within a year", description: "Building deliberately" },
      { value: "just_exploring", label: "Just exploring", description: "No fixed timeline yet" },
    ],
  },
];

export default function AdvisorWizard({ onComplete, onCancel }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<AdvisorAnswers>>({});
  const [contextText, setContextText] = useState("");
  const totalSteps = STEPS.length + 1; // +1 for context step
  const isContextStep = stepIdx === STEPS.length;
  const progress = ((stepIdx + 1) / totalSteps) * 100;

  const currentStep = !isContextStep ? STEPS[stepIdx] : null;
  const currentValue = currentStep ? (answers[currentStep.key] as string | undefined) : undefined;

  const handleSelect = (value: string) => {
    if (!currentStep) return;
    setAnswers({ ...answers, [currentStep.key]: value });
    trackAdvisor("wizard_step", {
      stepIndex: stepIdx,
      metadata: { key: currentStep.key, value },
    });
    // Auto-advance after a short delay for nice feel
    setTimeout(() => {
      if (stepIdx < totalSteps - 1) setStepIdx(stepIdx + 1);
    }, 220);
  };

  const handleFinish = () => {
    trackAdvisor("wizard_complete", {
      metadata: { has_freetext: contextText.trim().length > 0 },
    });
    onComplete({ ...(answers as AdvisorAnswers), freetext_context: contextText.trim() || undefined });
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <span>Step {stepIdx + 1} of {totalSteps}</span>
            <button onClick={onCancel} className="hover:text-foreground">Exit</button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep && (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">{currentStep.question}</h2>
                {currentStep.helper && (
                  <p className="text-muted-foreground mb-6">{currentStep.helper}</p>
                )}
                <div className="grid gap-3">
                  {currentStep.options.map((opt) => {
                    const isSelected = currentValue === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "text-left p-4 rounded-xl border-2 transition-all hover-lift",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <div className="font-semibold text-foreground">{opt.label}</div>
                        {opt.description && (
                          <div className="text-sm text-muted-foreground mt-1">{opt.description}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {isContextStep && (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                  Anything else that would help us personalise this?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Optional — even one sentence about your situation helps us recommend better. (e.g. "I was retrenched", "my employer wants me certified by June", "I want to freelance on Upwork")
                </p>
                <Textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Tell us a bit more about your situation..."
                  rows={5}
                  className="resize-none"
                />
                <Button
                  onClick={handleFinish}
                  size="lg"
                  className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white"
                >
                  <Sparkles className="mr-2 w-5 h-5" />
                  Generate my pathway
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
            disabled={stepIdx === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {!isContextStep && currentValue && (
            <Button variant="ghost" onClick={() => setStepIdx(stepIdx + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}