import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/hooks/useAuth";

interface ModuleGuardProps {
  children: React.ReactNode;
  /** Roles allowed in addition to `admin` (which is always allowed). */
  roles: string[];
  /** Human name for the module used in the denial toast. */
  moduleName?: string;
}

const ModuleGuard = ({ children, roles, moduleName = "this module" }: ModuleGuardProps) => {
  const { session, roles: userRoles, isReady } = useAuth();
  const location = useLocation();
  const warned = useRef(false);
  const allowed = Array.from(new Set(["admin", ...roles])) as AppRole[];
  const ok = !!session && allowed.some((r) => userRoles.includes(r));

  useEffect(() => {
    if (isReady && !ok && !warned.current) {
      warned.current = true;
      toast.error(session ? `You don't have access to ${moduleName}` : "Please sign in to continue");
    }
  }, [isReady, ok, session, moduleName]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking permissions…</span>
      </div>
    );
  }
  if (!ok) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
};

export default ModuleGuard;