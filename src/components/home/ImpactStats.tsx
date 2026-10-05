import React, { useEffect, useRef, useState } from "react";
import { Award, Briefcase, TrendingUp, Users } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Stat {
  icon: React.ElementType;
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
}

const stats: Stat[] = [
  { icon: Users, value: 10000, suffix: "+", label: "Learners trained across programmes" },
  { icon: Briefcase, prefix: "~", value: 2000, label: "Verified digital job placements" },
  { icon: TrendingUp, prefix: "UGX ", value: 1.2, suffix: "B", decimals: 1, label: "Earned annually by our talent" },
  { icon: Award, value: 95, suffix: "%", label: "Course-completion rate" },
];

const useCountUp = (target: number, active: boolean, decimals = 0, duration = 1400) => {
  const [value, setValue] = useState(active ? target : 0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, decimals, duration]);

  return value;
};

const StatItem = ({ stat, active }: { stat: Stat; active: boolean }) => {
  const value = useCountUp(stat.value, active, stat.decimals ?? 0);
  const formatted =
    (stat.decimals ?? 0) > 0 ? value.toFixed(stat.decimals) : Math.round(value).toLocaleString();

  return (
    <div className="flex flex-col items-center rounded-xl bg-card p-6 text-center shadow-sm hover-lift">
      <stat.icon className="mb-3 h-7 w-7 text-primary" aria-hidden="true" />
      <div className="text-3xl font-bold tabular-nums">
        {stat.prefix}
        {formatted}
        {stat.suffix}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
    </div>
  );
};

const ImpactStats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduced) {
      setActive(true);
      return;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <section ref={ref} className="bg-secondary py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            Proof, not promises
          </p>
          <h2 className="heading-lg">From promise to proof</h2>
          <p className="mt-3 text-muted-foreground">
            Not projections — outcomes. Verified earning is our single measure of success.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;
