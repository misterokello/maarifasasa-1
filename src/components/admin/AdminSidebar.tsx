import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  CreditCard,
  ReceiptText,
  Award,
  Rocket,
  Settings,
  HelpCircle,
  ChevronLeft,
  LogOut,
  Menu,
  X,
  Megaphone,
  Newspaper,
  Sparkles,
  Plug,
  Send,
  Briefcase,
  ShieldCheck,
  GraduationCap,
  Tag,
  Wallet,
  Handshake,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import logoWh from "@/assets/maarifasasa-logo-wh.png.asset.json";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

// `roles` = roles (besides `admin`, which always has access) allowed to see the
// item. `adminOnly` items are visible to super admins only. Items with no
// restriction are visible to any signed-in admin-area user.
type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  roles?: AppRole[];
  adminOnly?: boolean;
};

const menuItems: { label: string; items: MenuItem[] }[] = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/super-admin-dashboard", roles: ["payments_admin"] },
      { title: "Products", icon: BookOpen, href: "/admin-courses", roles: ["products_admin"] },
      { title: "Payments", icon: CreditCard, href: "/super-admin-dashboard?tab=payments", roles: ["payments_admin"] },
      { title: "Payments Audit", icon: ReceiptText, href: "/admin-payments-audit", roles: ["payments_admin"] },
      { title: "Users", icon: Users, href: "/admin-users", adminOnly: true },
      { title: "Learners", icon: GraduationCap, href: "/admin-learners", adminOnly: true },
      { title: "Enquiries", icon: Inbox, href: "/admin-enquiries", adminOnly: true },
      { title: "Access Control", icon: ShieldCheck, href: "/admin-access", adminOnly: true },
      { title: "Discounts", icon: Tag, href: "/admin-discounts", roles: ["discount_admin"] },
      { title: "Payouts", icon: Wallet, href: "/admin-payouts", roles: ["affiliate_admin", "discount_admin", "payments_admin"] },
      { title: "Popups", icon: Megaphone, href: "/admin-popups", roles: ["popups_admin"] },
      { title: "Media Features", icon: Newspaper, href: "/admin-media", roles: ["blog_admin"] },
      { title: "Engagement", icon: Send, href: "/admin-engagement", roles: ["engagement_admin"] },
      { title: "Hiring", icon: Briefcase, href: "/admin-hiring", roles: ["hr_admin"] },
      { title: "AI Advisor", icon: Sparkles, href: "/admin/advisor", roles: ["advisor_admin"] },
      { title: "Blog", icon: FileText, href: "/blog-admin", roles: ["blog_admin"] },
      { title: "Comments", icon: MessageSquare, href: "/blog-admin?tab=comments", roles: ["blog_admin"] },
      { title: "Integrations", icon: Plug, href: "/admin/integrations", adminOnly: true },
    ],
  },
  {
    label: "Products",
    items: [
      { title: "Certificates", icon: Award, href: "/admin-courses?tab=certificates", roles: ["products_admin"] },
      { title: "Bootcamps", icon: Rocket, href: "/admin-courses?tab=bootcamps", roles: ["products_admin"] },
    ],
  },
  {
    label: "Help",
    items: [
      { title: "Settings", icon: Settings, href: "/profile" },
      { title: "Support", icon: HelpCircle, href: "/contact" },
    ],
  },
];

const SidebarContent = ({ 
  collapsed = false, 
  onToggle,
  onItemClick,
}: { 
  collapsed?: boolean; 
  onToggle?: () => void;
  onItemClick?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roles: userRoles } = useAuth();
  const [isPartner, setIsPartner] = React.useState(false);

  // Partners (referrers who own a discount code) get their Partner Portal
  // surfaced right inside the dashboard they already use.
  React.useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("discount_codes")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);
      if (active) setIsPartner((data?.length ?? 0) > 0);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar-background))] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 min-w-0" onClick={onItemClick}>
          <img
            src={logoWh.url}
            alt="Maarifasasa"
            className={cn("w-auto object-contain", collapsed ? "h-8" : "h-10")}
          />
        </Link>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-white/60 hover:text-white hover:bg-white/10 hidden lg:flex"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems
          .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
              if (userRoles.includes("admin")) return true;
              if (item.adminOnly) return false;
              if (!item.roles) return true;
              return item.roles.some((r) => userRoles.includes(r));
            }),
          }))
          .map((section) =>
            section.label === "Menu" && isPartner
              ? {
                  ...section,
                  items: [
                    ...section.items,
                    { title: "Partner Portal", icon: Handshake, href: "/partners/portal" },
                  ],
                }
              : section,
          )
          .filter((section) => section.items.length > 0)
          .map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && (
              <span className="px-6 text-xs font-semibold uppercase tracking-wider text-white/40">
                {section.label}
              </span>
            )}
            <ul className="mt-3 space-y-1 px-3">
              {section.items.map((item) => (
                <li key={item.title}>
                  <Link
                    to={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-white border-l-2 border-primary"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive(item.href) && "text-primary")} />
                    {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-white/60 hover:text-white hover:bg-white/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

// Mobile hamburger trigger button - exported for use in header
export const MobileMenuTrigger = ({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 w-72 border-0 bg-[hsl(var(--sidebar-background))]"
      >
        <SidebarContent onItemClick={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
};

const AdminSidebar = ({ collapsed = false, onToggle }: AdminSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 hidden lg:flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
};

export default AdminSidebar;
