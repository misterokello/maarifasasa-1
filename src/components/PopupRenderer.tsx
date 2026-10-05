import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface PopupData {
  id: string;
  popup_type: "promotional" | "banner" | "tally_embed";
  heading: string | null;
  body_text: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  banner_color: string | null;
  tally_form_id: string | null;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  start_date: string | null;
  end_date: string | null;
  target_pages: string[] | null;
  is_active: boolean;
}

const DISMISSED_KEY = "dismissed_popups";

const getDismissed = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
};

const setDismissed = (id: string) => {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]));
  }
};

const trackEvent = (popupId: string, eventType: "impression" | "dismissal" | "cta_click") => {
  supabase
    .from("popup_analytics" as any)
    .insert({ popup_id: popupId, event_type: eventType })
    .then(({ error }) => {
      if (error) console.error("Popup analytics error:", error);
    });
};

const PopupRenderer = () => {
  const location = useLocation();
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [visiblePopups, setVisiblePopups] = useState<Set<string>>(new Set());
  const trackedImpressions = useRef<Set<string>>(new Set());

  const isAdminRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super-admin") ||
    location.pathname.startsWith("/blog-admin") ||
    location.pathname.startsWith("/blog-editor");

  useEffect(() => {
    if (isAdminRoute) return;
    const fetchPopups = async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true);
      if (error) {
        console.error("Error fetching popups:", error);
        return;
      }
      setPopups((data as PopupData[]) || []);
    };
    fetchPopups();
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return;
    const now = new Date();
    const dismissed = getDismissed();
    const timers: ReturnType<typeof setTimeout>[] = [];

    popups.forEach((popup) => {
      if (popup.show_once_per_session && dismissed.includes(popup.id)) return;
      if (popup.start_date && new Date(popup.start_date) > now) return;
      if (popup.end_date && new Date(popup.end_date) < now) return;

      if (popup.target_pages && popup.target_pages.length > 0) {
        const matches = popup.target_pages.some((page) =>
          location.pathname === page || location.pathname.startsWith(page + "/")
        );
        if (!matches) return;
      }

      const timer = setTimeout(() => {
        setVisiblePopups((prev) => new Set([...prev, popup.id]));
      }, (popup.display_delay_seconds || 0) * 1000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [popups, location.pathname, isAdminRoute]);

  // Track impressions when popups become visible
  useEffect(() => {
    visiblePopups.forEach((id) => {
      if (!trackedImpressions.current.has(id)) {
        trackedImpressions.current.add(id);
        trackEvent(id, "impression");
      }
    });
  }, [visiblePopups]);

  const dismiss = useCallback((id: string) => {
    trackEvent(id, "dismissal");
    setDismissed(id);
    setVisiblePopups((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleCtaClick = useCallback((id: string) => {
    trackEvent(id, "cta_click");
    dismiss(id);
  }, [dismiss]);

  if (isAdminRoute) return null;

  const banners = popups.filter((p) => p.popup_type === "banner" && visiblePopups.has(p.id));
  const promotionals = popups.filter((p) => p.popup_type === "promotional" && visiblePopups.has(p.id));
  const tallyEmbeds = popups.filter((p) => p.popup_type === "tally_embed" && visiblePopups.has(p.id));

  return (
    <>
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="relative w-full text-white text-center py-3 px-12 text-sm font-medium z-50"
          style={{ backgroundColor: banner.banner_color || "#3b82f6" }}
        >
          {banner.button_link ? (
            <a
              href={banner.button_link}
              className="hover:underline"
              target={banner.button_link.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={() => trackEvent(banner.id, "cta_click")}
            >
              {banner.heading}
            </a>
          ) : (
            <span>{banner.heading}</span>
          )}
          <button
            onClick={() => dismiss(banner.id)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {promotionals.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-background rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => dismiss(promotionals[0].id)}
              className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 hover:bg-background shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
            {promotionals[0].image_url && (
              <div className="w-full max-h-56 overflow-hidden">
                <img src={promotionals[0].image_url} alt="" className="w-full h-56 object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              {promotionals[0].heading && (
                <h2 className="text-2xl font-bold text-foreground">{promotionals[0].heading}</h2>
              )}
              {promotionals[0].body_text && (
                <p className="text-muted-foreground leading-relaxed">{promotionals[0].body_text}</p>
              )}
              {promotionals[0].button_text && promotionals[0].button_link && (
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <a
                      href={promotionals[0].button_link}
                      target={promotionals[0].button_link.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={() => handleCtaClick(promotionals[0].id)}
                    >
                      {promotionals[0].button_text}
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tallyEmbeds.length > 0 && tallyEmbeds[0].tally_form_id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-background rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => dismiss(tallyEmbeds[0].id)}
              className="absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 hover:bg-background shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 space-y-4">
              {tallyEmbeds[0].heading && (
                <h2 className="text-2xl font-bold text-foreground">{tallyEmbeds[0].heading}</h2>
              )}
              <iframe
                src={`https://tally.so/embed/${tallyEmbeds[0].tally_form_id}?alignLeft=1&hideTitle=1&transparentBackground=1`}
                width="100%"
                height="400"
                frameBorder="0"
                title="Tally Form"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PopupRenderer;
