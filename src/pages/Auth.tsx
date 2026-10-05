import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { attributeSignup } from "@/lib/affiliateIntegration";
import { attributeDiscountSignup } from "@/lib/discountCodes";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const initialTab = (() => {
    const t = new URLSearchParams(location.search).get("tab");
    return t === "signup" || t === "reset" ? t : "login";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine where user intended to go before auth redirect
  const fromPath = (location.state as any)?.from?.pathname || null;

  const resolveRedirect = async (userId: string) => {
    // Check roles first
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.some(r => r.role === 'admin' || r.role === 'blog_admin')) {
      return "/blog-admin";
    }

    // Check affiliate status
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (affiliate) {
      // Returning affiliate → dashboard
      return "/affiliate-dashboard";
    }

    // If they were trying to reach affiliate-apply, honour that
    if (fromPath?.startsWith("/affiliate")) {
      return fromPath;
    }

    // If profile isn't complete, send new learners through the onboarding wizard
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_completed_at")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.profile_completed_at) {
      const safeFrom = fromPath && !fromPath.startsWith("/onboarding") && fromPath !== "/auth"
        ? fromPath
        : "/dashboard";
      const next = encodeURIComponent(safeFrom);
      return `/onboarding?next=${next}`;
    }

    return fromPath || "/";
  };

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const dest = await resolveRedirect(session.user.id);
        navigate(dest);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        setTimeout(async () => {
          // Idempotent — no-ops when profile already has thinkific_user_id.
          supabase.functions.invoke("thinkific-user-provision").catch(() => {});
          const dest = await resolveRedirect(session.user.id);
          navigate(dest);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = loginSchema.parse(loginData);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      // If "remember me" is off, downgrade the persisted session to session-only.
      // supabase-js persists tokens in localStorage by default; when the user opts
      // out we move them to sessionStorage so they clear on browser close.
      if (!rememberMe && data?.session) {
        try {
          const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
          if (key) {
            const val = localStorage.getItem(key);
            if (val) {
              sessionStorage.setItem(key, val);
              localStorage.removeItem(key);
            }
          }
        } catch { /* ignore */ }
      }

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email before logging in");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session) {
        toast.success("Logged in successfully");
        const dest = await resolveRedirect(data.session.user.id);
        navigate(dest);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validated = signupSchema.parse(signupData);
      setLoading(true);

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please log in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Fire-and-forget affiliate signup attribution
        attributeSignup(data.user.id).catch(() => {});
        // Fire-and-forget discount-code referral attribution
        attributeDiscountSignup(
          data.user.id,
          data.user.email,
          (validated as { full_name?: string }).full_name ?? null,
        ).catch(() => {});
        // Guarantee a profile row exists (no auth trigger is installed on this project).
        if (data.session) {
          supabase
            .from("profiles")
            .upsert(
              { id: data.user.id, email: data.user.email, full_name: "" },
              { onConflict: "id", ignoreDuplicates: true },
            )
            .then(() => {}, () => {});
        }
        // Fire-and-forget Thinkific user provisioning so the LMS account
        // (and password-setup email) is ready by the time the learner opens
        // a course. Requires a live session — skipped when email confirmation
        // is required and will run on first login instead.
        if (data.session) {
          supabase.functions.invoke("thinkific-user-provision").catch(() => {});
        }
        setSignupData({ email: "", password: "", confirmPassword: "" });
        if (data.session) {
          // Email confirmation disabled — session is live, route through resolveRedirect
          // (new users without a completed profile land on /onboarding, others on /dashboard).
          toast.success("Account created! Let's set up your profile.");
          const dest = await resolveRedirect(data.session.user.id);
          navigate(dest);
        } else {
          // Email confirmation required — no session yet.
          toast.success("Account created! Check your email to confirm, then log in.");
          setActiveTab("login");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailSchema = z.string().trim().email({ message: "Invalid email address" });
    
    try {
      const validated = emailSchema.parse(resetEmail);
      setLoading(true);

      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(validated, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password reset email sent! Please check your inbox.");
      setResetEmail("");
      setActiveTab("login");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0].message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4 pt-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Maarifasasa</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <PasswordInput
                    id="login-password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
                  <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">Remember me on this device</Label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log In"
                  )}
                </Button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reset")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <PasswordInput
                    id="signup-confirm-password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset email...
                    </>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-sm text-primary hover:underline"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
