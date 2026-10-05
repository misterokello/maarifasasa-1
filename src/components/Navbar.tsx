import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  FileText,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AdminLoginDialog from "./AdminLoginDialog";
import RoleSwitcher from "./RoleSwitcher";
import { useAuth, ROLE_LABELS } from "@/hooks/useAuth";
import { useUserAvatar } from "@/hooks/useUserAvatar";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { user, roles: userRoles, activeRole, signOut } = useAuth();
  const { avatarUrl, fullName, initials } = useUserAvatar();
  const navigate = useNavigate();
  const location = useLocation();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const getUserInitials = () => {
    if (initials) return initials;
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleDisplay = () => {
    const active = activeRole ?? userRoles[0];
    if (!active) return "Learner";
    const label = ROLE_LABELS[active] ?? active;
    return userRoles.length > 1 ? `${label} · ${userRoles.length} roles` : label;
  };

  const navItems = [
    { label: "Academy", href: "/academy" },
    { label: "Learning Programs", href: "/learning" },
    { label: "Find Your Path", href: "/advisor" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Affiliate", href: "https://affiliates.maarifasasa.com" },
  ];

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  const activeItem = navItems.find((i) => !i.href.startsWith("http") && isActive(i.href))?.label;
  const highlight = hovered ?? activeItem;

  return (
    <>
      <AdminLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      <header className="fixed top-0 left-0 right-0 z-50">
        {/* scroll progress hairline */}
        <motion.div
          style={{ scaleX: progress }}
          className="absolute top-0 left-0 right-0 h-[2px] origin-left bg-[image:var(--gradient-primary)]"
        />

        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <motion.div
            animate={{
              marginTop: scrolled ? 10 : 18,
              paddingLeft: scrolled ? 12 : 16,
              paddingRight: scrolled ? 12 : 16,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={cn(
              "relative flex items-center justify-between rounded-2xl transition-[background-color,box-shadow,border-color] duration-500",
              scrolled
                ? "bg-background/70 backdrop-blur-xl border border-border/60 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]"
                : "bg-background/40 backdrop-blur-md border border-transparent"
            )}
          >
            {/* soft gradient sheen */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                scrolled && "opacity-100"
              )}
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)/0.06), transparent 40%, hsl(var(--accent)/0.06))",
              }}
            />

            <motion.div animate={{ height: scrolled ? 58 : 70 }} className="flex items-center" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
              <Link to="/" className="group flex items-center gap-2">
                <motion.img
                  src="/lovable-uploads/afef8974-952c-4670-93d3-91cfab42af06.png"
                  alt="Maarifasasa Logo"
                  animate={{ height: scrolled ? 34 : 44 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  className="w-auto transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </Link>
            </motion.div>

            {/* desktop nav with sliding highlight */}
            <nav
              className="hidden lg:flex items-center gap-0.5 relative"
              onMouseLeave={() => setHovered(null)}
            >
              {navItems.map((item) => {
                const external = item.href.startsWith("http");
                const active = !external && isActive(item.href);
                const inner = (
                  <>
                    {highlight === item.label && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className={cn(
                          "absolute inset-0 rounded-full",
                          active ? "bg-primary/10" : "bg-muted"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex items-center gap-1",
                        active ? "text-primary" : "text-foreground/70"
                      )}
                    >
                      {item.label}
                      {external && <ArrowUpRight className="h-3 w-3 opacity-60" />}
                    </span>
                  </>
                );
                const cls =
                  "relative px-3.5 py-2 text-[13.5px] font-medium rounded-full transition-colors";
                return external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onMouseEnter={() => setHovered(item.label)}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={cls}
                    onMouseEnter={() => setHovered(item.label)}
                  >
                    {inner}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-2.5">
              {user ? (
                <>
                  <RoleSwitcher />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-11 pl-1 pr-2.5 rounded-full hover:bg-muted/70 gap-1.5 group"
                      >
                        <Avatar className="h-9 w-9 ring-2 ring-primary/15 transition-all group-hover:ring-primary/40">
                          <AvatarImage src={avatarUrl || undefined} alt={fullName || user.email || "Your profile"} />
                          <AvatarFallback className="bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold text-sm">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-xl p-1.5 rounded-2xl shadow-lg border-border/60" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal px-2 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl || undefined} alt={fullName || user.email || "Your profile"} />
                            <AvatarFallback className="bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{user.email}</p>
                            <p className="text-xs leading-none text-muted-foreground mt-1">{getRoleDisplay()}</p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link to="/dashboard" className="flex items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>My Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                        <Link to="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {userRoles.includes("admin") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
                            Admin
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link to="/super-admin-dashboard" className="flex items-center">
                              <Shield className="mr-2 h-4 w-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link to="/admin-users" className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              <span>Manage Users</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link to="/admin-courses" className="flex items-center">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Manage Courses</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {userRoles.includes("blog_admin") && !userRoles.includes("admin") && (
                        <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                          <Link to="/blog-admin" className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Blog Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="rounded-full text-sm font-medium">
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-full text-sm font-semibold bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] transition-shadow border-0"
                  >
                    <Link to="/auth?tab=signup" className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* mobile controls */}
            <div className="lg:hidden flex items-center gap-2">
              {user && (
                <Link to="/profile" aria-label="View your profile" className="rounded-full">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/15">
                    <AvatarImage src={avatarUrl || undefined} alt={fullName || user.email || "Your profile"} />
                    <AvatarFallback className="bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              )}
              <button
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-border/60 bg-background/60 text-foreground hover:bg-muted transition-colors"
              >
                <AnimatePresence initial={false} mode="wait">
                  {isOpen ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        </div>

        {/* mobile sheet */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                key="scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="lg:hidden fixed inset-0 top-0 -z-10 bg-foreground/20 backdrop-blur-sm"
              />
              <motion.div
                key="sheet"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="lg:hidden mx-3 sm:mx-6 mt-2 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)] overflow-hidden"
              >
                <div className="px-4 pt-4 pb-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  {user && (
                    <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-muted/60">
                      <Link to="/profile" onClick={() => setIsOpen(false)} aria-label="View your profile" className="rounded-full">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={avatarUrl || undefined} alt={fullName || user.email || "Your profile"} />
                          <AvatarFallback className="bg-[image:var(--gradient-primary)] text-primary-foreground font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
                      </div>
                    </div>
                  )}

                  {user && userRoles.length > 1 && (
                    <div className="mb-3 px-1">
                      <RoleSwitcher variant="inline" className="w-full justify-between" />
                    </div>
                  )}

                  <nav className="flex flex-col gap-1">
                    {navItems.map((item, i) => {
                      const external = item.href.startsWith("http");
                      const active = !external && isActive(item.href);
                      const cls = cn(
                        "flex items-center justify-between px-3 py-3 rounded-xl text-[15px] font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      );
                      const content = (
                        <>
                          <span>{item.label}</span>
                          <ArrowUpRight className={cn("h-4 w-4", active ? "opacity-80" : "opacity-40")} />
                        </>
                      );
                      return (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 26 }}
                        >
                          {external ? (
                            <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => setIsOpen(false)}>
                              {content}
                            </a>
                          ) : (
                            <Link to={item.href} className={cls} onClick={() => setIsOpen(false)}>
                              {content}
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </nav>

                  <div className="h-px bg-border my-4" />

                  <div className="flex flex-col gap-1">
                    {user ? (
                      <>
                        <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground/80 hover:bg-muted">
                          <LayoutDashboard className="mr-3 h-4 w-4" /> My Dashboard
                        </Link>
                        <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground/80 hover:bg-muted">
                          <User className="mr-3 h-4 w-4" /> Profile
                        </Link>
                        {userRoles.includes("admin") && (
                          <Link to="/super-admin-dashboard" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground/80 hover:bg-muted">
                            <Shield className="mr-3 h-4 w-4" /> Admin Dashboard
                          </Link>
                        )}
                        {userRoles.includes("blog_admin") && !userRoles.includes("admin") && (
                          <Link to="/blog-admin" onClick={() => setIsOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-[15px] font-medium text-foreground/80 hover:bg-muted">
                            <FileText className="mr-3 h-4 w-4" /> Blog Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center px-3 py-2.5 rounded-xl text-[15px] font-medium text-destructive hover:bg-destructive/10 text-left"
                        >
                          <LogOut className="mr-3 h-4 w-4" /> Log out
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-2 pt-1">
                        <Button asChild variant="outline" className="rounded-full w-full">
                          <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                        </Button>
                        <Button
                          asChild
                          className="rounded-full w-full bg-[image:var(--gradient-primary)] text-primary-foreground border-0 shadow-[var(--shadow-elegant)]"
                        >
                          <Link to="/auth?tab=signup" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-1.5">
                            <Sparkles className="h-4 w-4" /> Get Started
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Navbar;
