import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AVATAR_UPDATED_EVENT = "profile-avatar-updated";

/** Loads the signed-in user's avatar + display name for header avatars. */
export const useUserAvatar = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAvatarUrl(null);
      setFullName(null);
      setEmail(null);
      return;
    }
    setEmail(session.user.email ?? null);
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", session.user.id)
      .maybeSingle();
    setAvatarUrl(data?.avatar_url ?? null);
    setFullName(data?.full_name ?? null);
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    const onUpdated = () => load();
    window.addEventListener(AVATAR_UPDATED_EVENT, onUpdated);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener(AVATAR_UPDATED_EVENT, onUpdated);
    };
  }, []);

  const initials = (() => {
    if (fullName?.trim()) {
      return fullName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "U";
  })();

  return { avatarUrl, fullName, email, initials, refresh: load };
};
