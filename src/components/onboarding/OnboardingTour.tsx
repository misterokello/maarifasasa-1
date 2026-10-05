import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  /** CSS selector for the target element */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description text */
  description: string;
  /** Preferred placement */
  placement?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  /** Unique key for localStorage persistence */
  tourId: string;
  /** Welcome modal content */
  welcome: {
    title: string;
    subtitle: string;
    description: string;
    icon?: React.ReactNode;
  };
  /** Tour steps */
  steps: TourStep[];
  /** Callback when tour completes */
  onComplete?: () => void;
}

type Phase = "idle" | "welcome" | "touring" | "done";

interface TooltipPosition {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right";
}

const SPOTLIGHT_PADDING = 10;

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourId,
  welcome,
  steps,
  onComplete,
}) => {
  const storageKey = `onboarding_${tourId}_completed`;
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour was already completed
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Delay to let dashboard render
      const timer = setTimeout(() => setPhase("welcome"), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const completeTour = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    setPhase("done");
    onComplete?.();
  }, [storageKey, onComplete]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setPhase("touring");
  }, []);

  // Position tooltip relative to target element
  const positionTooltip = useCallback(() => {
    if (phase !== "touring" || !steps[currentStep]) return;

    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) {
      // Element not found, skip step
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        completeTour();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);

    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Calculate tooltip position after a tick for scrolling
    requestAnimationFrame(() => {
      const updatedRect = el.getBoundingClientRect();
      setSpotlightRect(updatedRect);

      const tooltipWidth = 340;
      const tooltipHeight = 180;
      const gap = 16;
      let placement = step.placement || "bottom";
      let top = 0;
      let left = 0;

      // Try preferred placement, fall back if off-screen
      const spaceBelow = window.innerHeight - updatedRect.bottom;
      const spaceAbove = updatedRect.top;
      const spaceRight = window.innerWidth - updatedRect.right;
      const spaceLeft = updatedRect.left;

      if (placement === "bottom" && spaceBelow < tooltipHeight + gap) {
        placement = spaceAbove > tooltipHeight + gap ? "top" : "right";
      } else if (placement === "top" && spaceAbove < tooltipHeight + gap) {
        placement = spaceBelow > tooltipHeight + gap ? "bottom" : "right";
      }

      switch (placement) {
        case "bottom":
          top = updatedRect.bottom + gap;
          left = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
          break;
        case "top":
          top = updatedRect.top - tooltipHeight - gap;
          left = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
          break;
        case "right":
          top = updatedRect.top + updatedRect.height / 2 - tooltipHeight / 2;
          left = updatedRect.right + gap;
          break;
        case "left":
          top = updatedRect.top + updatedRect.height / 2 - tooltipHeight / 2;
          left = updatedRect.left - tooltipWidth - gap;
          break;
      }

      // Clamp to viewport
      left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
      top = Math.max(12, Math.min(top, window.innerHeight - tooltipHeight - 12));

      setTooltipPos({ top, left, placement });
    });
  }, [phase, currentStep, steps, completeTour]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [positionTooltip]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  if (phase === "idle" || phase === "done") return null;

  // Welcome Modal
  if (phase === "welcome") {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={skipTour}
        />
        {/* Modal */}
        <div className="relative z-10 bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 fade-in duration-300">
          <button
            onClick={skipTour}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {welcome.icon || <Sparkles className="h-8 w-8 text-primary" />}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{welcome.title}</h2>
            <p className="text-lg text-primary font-medium">{welcome.subtitle}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {welcome.description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button onClick={startTour} size="lg" className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              Take the Tour
            </Button>
            <Button
              variant="ghost"
              onClick={skipTour}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Tour overlay with spotlight
  if (phase === "touring" && tooltipPos && spotlightRect) {
    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return createPortal(
      <div className="fixed inset-0 z-[9999]">
        {/* SVG overlay with spotlight cutout */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left - SPOTLIGHT_PADDING}
                y={spotlightRect.top - SPOTLIGHT_PADDING}
                width={spotlightRect.width + SPOTLIGHT_PADDING * 2}
                height={spotlightRect.height + SPOTLIGHT_PADDING * 2}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: "auto" }}
            onClick={skipTour}
          />
        </svg>

        {/* Spotlight ring */}
        <div
          className="absolute border-2 border-primary rounded-lg pointer-events-none transition-all duration-300"
          style={{
            top: spotlightRect.top - SPOTLIGHT_PADDING,
            left: spotlightRect.left - SPOTLIGHT_PADDING,
            width: spotlightRect.width + SPOTLIGHT_PADDING * 2,
            height: spotlightRect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 4px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)",
          }}
        />

        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute z-10 bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: 340,
          }}
        >
          <div className="p-5">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={skipTour}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Progress value={progress} className="h-1.5 mb-4" />

            <h3 className="text-base font-semibold text-foreground mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30 rounded-b-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button size="sm" onClick={nextStep} className="gap-1">
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
};

export default OnboardingTour;

/** Helper to reset a tour (for testing or re-triggering) */
export const resetTour = (tourId: string) => {
  localStorage.removeItem(`onboarding_${tourId}_completed`);
};
