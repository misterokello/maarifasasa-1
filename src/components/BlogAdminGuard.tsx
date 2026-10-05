import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const BlogAdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, roles, isReady } = useAuth();
  const location = useLocation();
  const warned = useRef(false);
  const authorized = !!session && (roles.includes("admin") || roles.includes("blog_admin"));

  useEffect(() => {
    if (isReady && !authorized && !warned.current) {
      warned.current = true;
      toast.error(session ? "You don't have permission to access this page" : "Please sign in to access this page");
    }
  }, [isReady, authorized, session]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking permissions...</span>
      </div>
    );
  }
  if (!authorized) return <Navigate to="/auth" replace state={{ from: location }} />;
  return <>{children}</>;
};

export default BlogAdminGuard;
