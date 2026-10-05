import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertSeverity = "critical" | "warning" | "info";

export type DashboardAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric?: string;
  threshold?: string;
  to?: string;
  actionLabel?: string;
};

const SEV_META: Record<
  AlertSeverity,
  { icon: React.ReactNode; label: string; ring: string; bg: string; text: string; dot: string }
> = {
  critical: {
    icon: <AlertOctagon className="h-4 w-4" />,
    label: "Critical",
    ring: "ring-destructive/30",
    bg: "bg-destructive/5",
    text: "text-destructive",
    dot: "bg-destructive",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Warning",
    ring: "ring-warning/30",
    bg: "bg-warning/5",
    text: "text-warning",
    dot: "bg-warning",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    label: "Info",
    ring: "ring-primary/20",
    bg: "bg-primary/5",
    text: "text-primary",
    dot: "bg-primary",
  },
};

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  rangeLabel?: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, rangeLabel }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const visible = useMemo(
    () => alerts.filter((a) => !dismissed.has(a.id)),
    [alerts, dismissed],
  );

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    visible.forEach((a) => (c[a.severity] += 1));
    return c;
  }, [visible]);

  if (visible.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-success/10 text-success flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">All systems healthy</p>
            <p className="text-xs text-muted-foreground">
              No threshold breaches detected{rangeLabel ? ` for ${rangeLabel.toLowerCase()}` : ""}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const top = collapsed ? [] : visible;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {visible.length} alert{visible.length === 1 ? "" : "s"} need attention
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                {counts.critical > 0 && (
                  <span className="inline-flex items-center gap-1 text-destructive font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    {counts.critical} critical
                  </span>
                )}
                {counts.warning > 0 && (
                  <span className="inline-flex items-center gap-1 text-warning font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    {counts.warning} warning
                  </span>
                )}
                {counts.info > 0 && (
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {counts.info} info
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className="shrink-0"
          >
            {collapsed ? (
              <>
                Show <ChevronDown className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Hide <ChevronUp className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {!collapsed && (
          <ul className="divide-y">
            {top.map((a) => {
              const meta = SEV_META[a.severity];
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30",
                    meta.bg,
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ring-1",
                      meta.text,
                      meta.ring,
                      "bg-background",
                    )}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{a.title}</p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] uppercase tracking-wide", meta.text)}
                      >
                        {meta.label}
                      </Badge>
                      {a.metric && (
                        <span className={cn("text-xs font-bold", meta.text)}>{a.metric}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    {a.threshold && (
                      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                        Threshold: {a.threshold}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.to && (
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                        <Link to={a.to}>{a.actionLabel || "Investigate"}</Link>
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setDismissed((prev) => {
                          const n = new Set(prev);
                          n.add(a.id);
                          return n;
                        })
                      }
                      aria-label="Dismiss alert"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsPanel;