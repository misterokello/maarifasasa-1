import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "blog_admin"
  | "hr_admin"
  | "engagement_admin"
  | "products_admin"
  | "popups_admin"
  | "advisor_admin"
  | "affiliate_admin"
  | "payments_admin"
  | "learner_admin"
  | "discount_admin"
  | "partner_admin"
  | "user";

export const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  blog_admin: "Blog Admin",
  hr_admin: "Hiring Admin",
  engagement_admin: "Engagement Admin",
  products_admin: "Products Admin",
  popups_admin: "Popups Admin",
  advisor_admin: "Advisor Admin",
  affiliate_admin: "Affiliate Admin",
  payments_admin: "Payments Admin",
  learner_admin: "Learner Admin",
  discount_admin: "Discounts Admin",
  partner_admin: "Partner Admin",
  user: "Learner",
};

export const ROLE_HOMES: Record<string, string> = {
  admin: "/super-admin-dashboard",
  blog_admin: "/blog-admin",
  hr_admin: "/admin-hiring",
  engagement_admin: "/admin-engagement",
  products_admin: "/admin-courses",
  popups_admin: "/admin-popups",
  advisor_admin: "/admin/advisor",
  affiliate_admin: "/admin-users",
  payments_admin: "/super-admin-dashboard",
  learner_admin: "/admin-learners",
  discount_admin: "/admin-discounts",
  partner_admin: "/organisation-portal",
  user: "/dashboard",
};

const ACTIVE_ROLE_KEY = "ms_active_role";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  isReady: boolean;
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  refreshRoles: () => Promise<void>;
  hasRole: (role: AppRole | AppRole[]) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  const loadRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      return [] as AppRole[];
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to load user roles", error);
      setRoles([]);
      return [] as AppRole[];
    }
    const list = (data?.map((r) => r.role as AppRole) ?? []);
    if (list.length === 0) list.push("user");
    setRoles(list);
    return list;
  }, []);

  const pickInitialActiveRole = useCallback((available: AppRole[]) => {
    const stored = (typeof window !== "undefined"
      ? window.localStorage.getItem(ACTIVE_ROLE_KEY)
      : null) as AppRole | null;
    if (stored && available.includes(stored)) return stored;
    // Prefer admin > any other admin role > user
    if (available.includes("admin")) return "admin";
    const otherAdmin = available.find((r) => r.endsWith("_admin"));
    return otherAdmin ?? available[0] ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Subscribe FIRST so nothing is missed. Keep the callback synchronous
    // (no awaits) — defer any Supabase work with setTimeout(0) to avoid
    // deadlocking the auth client.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!mounted) return;
      setSession(next);
      if (!next) {
        setRoles([]);
        setActiveRoleState(null);
        return;
      }
      setTimeout(() => {
        if (!mounted) return;
        loadRoles(next.user.id).then((list) => {
          if (!mounted) return;
          setActiveRoleState((current) => current ?? pickInitialActiveRole(list));
        });
      }, 0);
    });

    // Then hydrate from storage.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadRoles(data.session.user.id).then((list) => {
          if (!mounted) return;
          setActiveRoleState((current) => current ?? pickInitialActiveRole(list));
          setIsReady(true);
        });
      } else {
        setIsReady(true);
      }
    }).catch(() => {
      if (mounted) setIsReady(true);
    });

    // Safety net: never let "Checking authentication" spin forever.
    const failsafe = window.setTimeout(() => {
      if (mounted) setIsReady(true);
    }, 4000);

    return () => {
      mounted = false;
      window.clearTimeout(failsafe);
      sub.subscription.unsubscribe();
    };
  }, [loadRoles, pickInitialActiveRole]);

  const setActiveRole = useCallback((role: AppRole) => {
    setActiveRoleState(role);
    try {
      window.localStorage.setItem(ACTIVE_ROLE_KEY, role);
    } catch { /* ignore */ }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (!session?.user?.id) return;
    const list = await loadRoles(session.user.id);
    setActiveRoleState((current) => (current && list.includes(current) ? current : pickInitialActiveRole(list)));
  }, [session, loadRoles, pickInitialActiveRole]);

  const hasRole = useCallback(
    (role: AppRole | AppRole[]) => {
      const wanted = Array.isArray(role) ? role : [role];
      return wanted.some((r) => roles.includes(r));
    },
    [roles],
  );

  const signOut = useCallback(async () => {
    try {
      window.localStorage.removeItem(ACTIVE_ROLE_KEY);
    } catch { /* ignore */ }
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      roles,
      isReady,
      activeRole,
      setActiveRole,
      refreshRoles,
      hasRole,
      signOut,
    }),
    [session, roles, isReady, activeRole, setActiveRole, refreshRoles, hasRole, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
