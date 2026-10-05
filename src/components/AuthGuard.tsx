
import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { session, isReady } = useAuth();
  const location = useLocation();
  const warned = useRef(false);

  useEffect(() => {
    if (isReady && requireAuth && !session && !warned.current) {
      warned.current = true;
      toast.error("Please sign in to access this page");
    }
  }, [isReady, requireAuth, session]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  if (!session && requireAuth) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AuthGuard;
