import React, { useState, useEffect } from "react";
import AdminSidebar, { MobileMenuTrigger } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { cn } from "@/lib/utils";

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AdminDashboardLayout = ({ 
  children, 
  title = "Dashboard",
  subtitle = "Track and manage your platform performance"
}: AdminDashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide the main navbar and footer when this layout is active
  useEffect(() => {
    const navbar = document.querySelector('header.fixed');
    const footer = document.querySelector('footer');
    const mainWrapper = document.querySelector('.flex-grow');
    
    if (navbar) (navbar as HTMLElement).style.display = 'none';
    if (footer) (footer as HTMLElement).style.display = 'none';
    if (mainWrapper) (mainWrapper as HTMLElement).style.paddingTop = '0';
    
    return () => {
      if (navbar) (navbar as HTMLElement).style.display = '';
      if (footer) (footer as HTMLElement).style.display = '';
      if (mainWrapper) (mainWrapper as HTMLElement).style.paddingTop = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div
        className={cn(
          "transition-all duration-300",
          "lg:ml-64",
          sidebarCollapsed && "lg:ml-20"
        )}
      >
        <AdminHeader 
          title={title} 
          subtitle={subtitle}
          mobileMenuTrigger={
            <MobileMenuTrigger open={mobileOpen} onOpenChange={setMobileOpen} />
          }
        />
        
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
