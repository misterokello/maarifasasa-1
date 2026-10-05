import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Eye, XCircle, MousePointerClick, Loader2 } from "lucide-react";

interface PopupStats {
  popup_id: string;
  impressions: number;
  dismissals: number;
  cta_clicks: number;
}

interface PopupAnalyticsProps {
  popupIds: string[];
}

const PopupAnalytics = ({ popupIds }: PopupAnalyticsProps) => {
  const [stats, setStats] = useState<Record<string, PopupStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (popupIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("popup_analytics" as any)
        .select("popup_id, event_type")
        .in("popup_id", popupIds);

      if (error) {
        console.error("Error fetching popup analytics:", error);
        setLoading(false);
        return;
      }

      const grouped: Record<string, PopupStats> = {};
      (data as any[])?.forEach((row: { popup_id: string; event_type: string }) => {
        if (!grouped[row.popup_id]) {
          grouped[row.popup_id] = { popup_id: row.popup_id, impressions: 0, dismissals: 0, cta_clicks: 0 };
        }
        if (row.event_type === "impression") grouped[row.popup_id].impressions++;
        else if (row.event_type === "dismissal") grouped[row.popup_id].dismissals++;
        else if (row.event_type === "cta_click") grouped[row.popup_id].cta_clicks++;
      });

      setStats(grouped);
      setLoading(false);
    };

    fetchStats();
  }, [popupIds]);

  if (loading) return null;

  return { stats };
};

export const PopupStatsInline = ({ popupId, stats }: { popupId: string; stats: Record<string, PopupStats> }) => {
  const s = stats[popupId];
  if (!s) {
    return <span className="text-xs text-muted-foreground">No data</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1 text-xs font-normal">
        <Eye className="h-3 w-3" /> {s.impressions}
      </Badge>
      <Badge variant="outline" className="gap-1 text-xs font-normal">
        <XCircle className="h-3 w-3" /> {s.dismissals}
      </Badge>
      <Badge variant="outline" className="gap-1 text-xs font-normal">
        <MousePointerClick className="h-3 w-3" /> {s.cta_clicks}
      </Badge>
    </div>
  );
};

export const usePopupAnalytics = (popupIds: string[]) => {
  const [stats, setStats] = useState<Record<string, PopupStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (popupIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      const { data, error } = await supabase
        .from("popup_analytics" as any)
        .select("popup_id, event_type")
        .in("popup_id", popupIds);

      if (error) {
        console.error("Error fetching popup analytics:", error);
        setLoading(false);
        return;
      }

      const grouped: Record<string, PopupStats> = {};
      (data as any[])?.forEach((row: { popup_id: string; event_type: string }) => {
        if (!grouped[row.popup_id]) {
          grouped[row.popup_id] = { popup_id: row.popup_id, impressions: 0, dismissals: 0, cta_clicks: 0 };
        }
        if (row.event_type === "impression") grouped[row.popup_id].impressions++;
        else if (row.event_type === "dismissal") grouped[row.popup_id].dismissals++;
        else if (row.event_type === "cta_click") grouped[row.popup_id].cta_clicks++;
      });

      setStats(grouped);
      setLoading(false);
    };

    fetchStats();
  }, [popupIds.join(",")]);

  return { stats, loading };
};

export default PopupAnalytics;
