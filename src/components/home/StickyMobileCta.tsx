import React, { useEffect, useState } from "react";
import { trackCta } from "@/lib/analytics";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const StickyMobileCta = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button asChild className="min-h-[44px] flex-1">
          <Link
            to="/learning"
            onClick={() =>
              trackCta({
                id: "sticky_learner",
                label: "Start Learning to Earn",
                location: "sticky_mobile",
                destination: "/learning",
                audience: "learner",
                stage: "intent",
              })
            }
          >
            Start Learning to Earn
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-[44px] flex-1">
          <Link
            to="/partners"
            onClick={() =>
              trackCta({
                id: "sticky_partner",
                label: "Partner with us",
                location: "sticky_mobile",
                destination: "/partners",
                audience: "enterprise",
                stage: "intent",
              })
            }
          >
            Partner with us
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default StickyMobileCta;
