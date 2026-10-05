import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const HrAdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, roles, isReady } = useAuth();
  const location = useLocation();
  const warned = useRef(false);
  const ok = !!session && (roles.includes("admin") || roles.includes("hr_admin"));

  useEffect(() => {
    if (isReady && !ok && !warned.current) {
      warned.current = true;
      toast.error(session ? "You do not have access to the hiring module" : "Please sign in to access the hiring dashboard");
    }
  }, [isReady, ok, session]);

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

export default HrAdminGuard;