import React, { ReactNode, useState, useCallback, useMemo, useEffect } from "react";
import { Bell, MessageSquare, Settings, Search, CreditCard, Clock, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { Link } from "react-router-dom";
import logoWh from "@/assets/maarifasasa-logo-wh.png.asset.json";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  mobileMenuTrigger?: ReactNode;
}

const DISMISSED_PAYMENTS_KEY = "dismissed-payment-notifications";
const DISMISSED_COMMENTS_KEY = "dismissed-comment-notifications";

const getStoredDismissed = (key: string): Set<string> => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const AdminHeader = ({ title = "Dashboard", subtitle = "Welcome back!", mobileMenuTrigger }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { soundEnabled, toggleSound } = useNotificationSound();
  const { avatarUrl, fullName, initials } = useUserAvatar();
  const [dismissedPayments, setDismissedPayments] = useState<Set<string>>(() => getStoredDismissed(DISMISSED_PAYMENTS_KEY));
  const [dismissedComments, setDismissedComments] = useState<Set<string>>(() => getStoredDismissed(DISMISSED_COMMENTS_KEY));

  // Comments and payments contain PII, so they are not broadcast over realtime.
  // Poll for new records instead (RLS still applies to these reads).
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["recent-comments-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["recent-payments-notifications"] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["recent-payments-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, currency, status, created_at, products(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: recentComments } = useQuery({
    queryKey: ["recent-comments-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments")
        .select("id, author_name, content, approved, created_at, blog_posts(title, slug)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Filter out dismissed notifications
  const visiblePayments = useMemo(() => 
    recentPayments?.filter(p => !dismissedPayments.has(p.id)) || [],
    [recentPayments, dismissedPayments]
  );

  const pendingComments = useMemo(() => 
    recentComments?.filter(c => !c.approved && !dismissedComments.has(c.id)) || [],
    [recentComments, dismissedComments]
  );

  const totalNotifications = visiblePayments.length + pendingComments.length;

  const handleDismissPayment = useCallback((e: React.MouseEvent, paymentId: string) => {
    e.stopPropagation();
    setDismissedPayments(prev => {
      const updated = new Set([...prev, paymentId]);
      localStorage.setItem(DISMISSED_PAYMENTS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  const handleDismissComment = useCallback((e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    setDismissedComments(prev => {
      const updated = new Set([...prev, commentId]);
      localStorage.setItem(DISMISSED_COMMENTS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  const handlePaymentClick = useCallback((paymentId: string) => {
    setDismissedPayments(prev => {
      const updated = new Set([...prev, paymentId]);
      localStorage.setItem(DISMISSED_PAYMENTS_KEY, JSON.stringify([...updated]));
      return updated;
    });
    navigate("/super-admin-dashboard?tab=payments");
  }, [navigate]);

  const handleCommentClick = useCallback((commentId: string) => {
    setDismissedComments(prev => {
      const updated = new Set([...prev, commentId]);
      localStorage.setItem(DISMISSED_COMMENTS_KEY, JSON.stringify([...updated]));
      return updated;
    });
    navigate("/blog-admin?tab=comments");
  }, [navigate]);

  const getUserInitials = () => {
    if (!user?.email) return "A";
    return user.email.charAt(0).toUpperCase();
  };

  const getUserName = () => {
    if (!user?.email) return "Admin";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toFixed(2)}`;
    if (currency === "UGX") return `UGX ${amount.toLocaleString()}`;
    return `${currency} ${amount}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: mobile trigger + logo + page title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {mobileMenuTrigger}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-[hsl(var(--sidebar-background))] rounded-lg p-1.5 flex-shrink-0 flex items-center justify-center">
              <img
                src={logoWh.url}
                alt="Maarifasasa"
                className="h-5 w-auto object-contain"
              />
            </div>
            <div className="hidden md:block min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center: search */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Right: welcome + actions */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="hidden xl:block text-sm text-muted-foreground mr-1">
            Welcome, <span className="text-foreground font-medium">{getUserName()}</span>
          </span>
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                    {totalNotifications > 9 ? "9+" : totalNotifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover border shadow-lg">
              <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Recent Payments */}
              {visiblePayments.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Recent Payments
                  </DropdownMenuLabel>
                  {visiblePayments.slice(0, 3).map((payment) => (
                    <DropdownMenuItem
                      key={payment.id}
                      className="flex items-start gap-3 p-3 cursor-pointer group"
                      onClick={() => handlePaymentClick(payment.id)}
                    >
                      <div className={`p-2 rounded-full ${
                        payment.status === "success" ? "bg-primary/10" : 
                        payment.status === "pending" ? "bg-accent/50" : "bg-destructive/10"
                      }`}>
                        <CreditCard className={`h-4 w-4 ${
                          payment.status === "success" ? "text-primary" :
                          payment.status === "pending" ? "text-accent-foreground" : "text-destructive"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {payment.products?.name || "Payment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(payment.amount, payment.currency)} • {payment.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDismissPayment(e, payment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Pending Comments */}
              {pendingComments.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    Pending Comments
                  </DropdownMenuLabel>
                  {pendingComments.slice(0, 3).map((comment) => (
                    <DropdownMenuItem
                      key={comment.id}
                      className="flex items-start gap-3 p-3 cursor-pointer group"
                      onClick={() => handleCommentClick(comment.id)}
                    >
                      <div className="p-2 rounded-full bg-accent">
                        <MessageSquare className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {comment.author_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {comment.content.slice(0, 50)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDismissComment(e, comment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {totalNotifications === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center justify-center text-primary cursor-pointer"
                onClick={() => navigate("/super-admin-dashboard?tab=payments")}
              >
                View all activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-lg">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={toggleSound}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-primary" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span>Notification Sounds</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  soundEnabled 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {soundEnabled ? "On" : "Off"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                All Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-2 flex items-center gap-3">
            <Link to="/profile" aria-label="View your profile" className="rounded-full">
              <Avatar className="h-9 w-9 border-2 border-primary">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || "Your profile"} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                  {initials || getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
