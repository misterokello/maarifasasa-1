import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Radio } from "lucide-react";

type FeedItem = {
  id: string;
  learner: string;
  course: string;
  completedAt: string;
  live?: boolean;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/**
 * Live feed of course completions. Seeds from public.enrollments and then
 * listens to realtime UPDATE/INSERT events so completions appear instantly.
 */
const LiveCompletionsFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  const describe = useCallback(async (row: any): Promise<FeedItem | null> => {
    if (!row?.completed_at) return null;
    const [{ data: profile }, { data: product }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", row.user_id).maybeSingle(),
      row.product_id
        ? supabase.from("products").select("name").eq("id", row.product_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    return {
      id: row.id,
      learner: profile?.full_name || profile?.email || "Learner",
      course:
        product?.name ||
        row.metadata?.thinkific_course_name ||
        (row.thinkific_course_id ? `Course ${row.thinkific_course_id}` : "Course"),
      completedAt: row.completed_at,
      live: true,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("enrollments")
        .select(
          "id, user_id, product_id, thinkific_course_id, completed_at, metadata, product:products(name), learner:profiles!enrollments_user_id_fkey(full_name, email)",
        )
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(15);
      if (cancelled) return;
      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        learner: r.learner?.full_name || r.learner?.email || "Learner",
        course:
          r.product?.name ||
          r.metadata?.thinkific_course_name ||
          (r.thinkific_course_id ? `Course ${r.thinkific_course_id}` : "Course"),
        completedAt: r.completed_at,
      }));
      mapped.forEach((m) => seen.current.add(m.id));
      setItems(mapped);
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin-completions-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enrollments" },
        async (payload: any) => {
          const row = payload.new;
          if (!row?.completed_at) return;
          if (payload.eventType === "UPDATE" && payload.old?.completed_at) return;
          const item = await describe(row);
          if (!item) return;
          setItems((prev) => {
            const rest = prev.filter((p) => p.id !== item.id);
            return [item, ...rest].slice(0, 15);
          });
          seen.current.add(item.id);
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [describe]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Live completions
          </CardTitle>
          <CardDescription>Course completions as learners finish them.</CardDescription>
        </div>
        <Badge variant={connected ? "default" : "outline"} className="gap-1 shrink-0">
          <Radio className="h-3 w-3" />
          {connected ? "Live" : "Connecting"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No completions recorded yet.
          </p>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.learner}</p>
                <p className="text-xs text-muted-foreground truncate">{it.course}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {it.live && <Badge variant="secondary">new</Badge>}
                <span className="text-xs text-muted-foreground">{timeAgo(it.completedAt)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default LiveCompletionsFeed;
