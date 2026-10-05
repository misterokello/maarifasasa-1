import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProductCard, CourseDetail } from "@/components/checkout/ProductCard";
import { LocationSelector } from "@/components/checkout/LocationSelector";
import { MobileMoneyForm } from "@/components/checkout/MobileMoneyForm";
import { StripeCheckoutButton } from "@/components/checkout/StripeCheckoutButton";
import { DiscountCodeField, AppliedDiscount } from "@/components/checkout/DiscountCodeField";
import { applyDiscount } from "@/lib/discountCodes";
import { PaymentStatusPoller } from "@/components/checkout/PaymentStatusPoller";
import { getAffiliateRef } from "@/lib/affiliateIntegration";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_ugx: number;
  price_usd: number;
  category: string;
  thinkific_course_id: string | null;
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const productSlug = searchParams.get("product");
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<"uganda" | "international">("uganda");
  const [paymentPlan, setPaymentPlan] = useState<"full" | "installment">("full");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authedUser, setAuthedUser] = useState<null | { id: string; email: string | null }>(null);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);

  const activeReferralCode = getAffiliateRef() || searchParams.get("ref");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthedUser(session ? { id: session.user.id, email: session.user.email ?? null } : null);
      setAuthChecked(true);
    };
    check();
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthedUser(session ? { id: session.user.id, email: session.user.email ?? null } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const supportsInstallment = (cat?: string | null, slug?: string | null) => {
    const c = (cat || "").toLowerCase();
    const s = (slug || "").toLowerCase();
    return c === "bootcamp" || c === "accelerator" || s === "talent-accelerator";
  };
  const installmentEligible = supportsInstallment(product?.category, product?.slug);
  const isInstallment = paymentPlan === "installment" && installmentEligible;

  const baseUGX = product
    ? isInstallment
      ? Math.ceil(product.price_ugx / 2)
      : product.price_ugx
    : 0;
  const baseUSD = product
    ? isInstallment
      ? Math.ceil(product.price_usd / 2)
      : product.price_usd
    : 0;
  const payableUGX = discount ? applyDiscount(baseUGX, discount.percentOff) : baseUGX;
  const payableUSD = discount ? applyDiscount(baseUSD, discount.percentOff) : baseUSD;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productSlug) {
        setError("No product specified");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("slug", productSlug)
          .eq("is_active", true)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Product not found");
        } else {
          setProduct(data);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productSlug]);

  // Fetch Thinkific course details when product has a linked course
  useEffect(() => {
    if (!product?.thinkific_course_id) return;

    const fetchCourseDetail = async () => {
      setCourseDetailLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/thinkific-course-detail?course_id=${product.thinkific_course_id}`
        );
        if (res.ok) {
          const data = await res.json();
          setCourseDetail(data);
        } else {
          console.warn("Failed to fetch course detail:", res.status);
        }
      } catch (err) {
        console.warn("Course detail fetch error:", err);
      } finally {
        setCourseDetailLoading(false);
      }
    };

    fetchCourseDetail();
  }, [product?.thinkific_course_id]);

  const handlePaymentInitiated = (id: string) => {
    setPaymentId(id);
  };

  const handleCancelPolling = () => {
    setPaymentId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The requested product could not be found."}
          </p>
          <Button asChild>
            <Link to="/programs">Browse Programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - {product.name} | Maarifasasa</title>
        <meta name="description" content={`Complete your purchase of ${product.name}`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/programs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="space-y-6">
            <ProductCard
              product={product}
              selectedLocation={selectedLocation}
              courseDetail={courseDetail}
              courseDetailLoading={courseDetailLoading}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!authChecked ? (
                  <div className="flex justify-center py-8"><Skeleton className="h-24 w-full" /></div>
                ) : !authedUser ? (
                  <div className="rounded-lg border bg-card p-6 text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                      <LogIn className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Sign in to continue</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your Maarifasasa account or sign in so we can enrol you into the course, track your progress, and issue your certificate.
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => navigate("/auth", { state: { from: routerLocation } })}
                      >
                        Sign in or create account
                      </Button>
                    </div>
                  </div>
                ) : paymentId ? (
                  <PaymentStatusPoller
                    paymentId={paymentId}
                    onCancel={handleCancelPolling}
                  />
                ) : (
                  <>
                    <LocationSelector
                      selected={selectedLocation}
                      onSelect={setSelectedLocation}
                    />

                    {installmentEligible && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <Label className="text-sm font-semibold">Payment Plan</Label>
                        <RadioGroup
                          value={paymentPlan}
                          onValueChange={(v) => setPaymentPlan(v as "full" | "installment")}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                            <RadioGroupItem value="full" id="plan-full" />
                            <Label htmlFor="plan-full" className="cursor-pointer flex-1">
                              <span className="font-medium">Pay in Full</span>
                              <span className="block text-sm text-muted-foreground">
                                {selectedLocation === "uganda"
                                  ? `UGX ${product.price_ugx.toLocaleString()}`
                                  : `$${product.price_usd}`}
                              </span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-muted/50">
                            <RadioGroupItem value="installment" id="plan-installment" />
                            <Label htmlFor="plan-installment" className="cursor-pointer flex-1">
                              <span className="font-medium">50% Installment</span>
                              <span className="block text-sm text-muted-foreground">
                                Pay{" "}
                                {selectedLocation === "uganda"
                                  ? `UGX ${Math.ceil(product.price_ugx / 2).toLocaleString()}`
                                  : `$${Math.ceil(product.price_usd / 2)}`}{" "}
                                now, remaining before bootcamp starts
                              </span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    <div className="border-t pt-6">
                      <div className="mb-6 space-y-4">
                        <DiscountCodeField
                          productSlug={product.slug}
                          applied={discount}
                          onApply={setDiscount}
                        />

                        {discount && (
                          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Subtotal</span>
                              <span className="line-through">
                                {selectedLocation === "uganda"
                                  ? `UGX ${baseUGX.toLocaleString()}`
                                  : `$${baseUSD}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Discount ({discount.percentOff}%)</span>
                              <span>
                                −
                                {selectedLocation === "uganda"
                                  ? `UGX ${(baseUGX - payableUGX).toLocaleString()}`
                                  : `$${baseUSD - payableUSD}`}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold pt-1 border-t">
                              <span>Total due</span>
                              <span>
                                {selectedLocation === "uganda"
                                  ? `UGX ${payableUGX.toLocaleString()}`
                                  : `$${payableUSD}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedLocation === "uganda" ? (
                        <MobileMoneyForm
                          productSlug={product.slug}
                          priceUGX={payableUGX}
                          onPaymentInitiated={handlePaymentInitiated}
                          referralCode={activeReferralCode}
                          isInstallment={isInstallment}
                          discountCode={discount?.code || null}
                        />
                      ) : (
                        <StripeCheckoutButton
                          productSlug={product.slug}
                          priceUSD={payableUSD}
                          referralCode={activeReferralCode}
                          isInstallment={isInstallment}
                          discountCode={discount?.code || null}
                        />
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
