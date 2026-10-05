import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BookOpen, ExternalLink, Play, GraduationCap } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentsListProps {
  userId: string;
}

interface Enrollment {
  id: string;
  payment_id: string;
  product_name: string;
  product_category: string;
  thinkific_course_url: string | null;
  thinkific_enrollment_id: number | null;
  thinkific_user_id: number | null;
  enrolled_at: string;
  progress?: number;
}

interface PaymentMetadata {
  thinkific_enrollment_id?: number;
  thinkific_user_id?: number;
  [key: string]: any;
}

const THINKIFIC_SIGNIN_URL = "https://maarifasasa.thinkific.com/users/sign_in";

export const EnrollmentsList = ({ userId }: EnrollmentsListProps) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<Record<number, number>>({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    loadEnrollments();
  }, [userId]);

  const loadEnrollments = async () => {
    try {
      // Get successful payments with product info
      const { data: payments, error } = await supabase
        .from("payments")
        .select(`
          id,
          created_at,
          metadata,
          product:products(
            name,
            category,
            thinkific_course_id,
            thinkific_course_url
          )
        `)
        .eq("user_id", userId)
        .eq("status", "success")
        .not("product_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrollmentList: Enrollment[] = (payments || []).map((payment: any) => {
        const metadata = payment.metadata as PaymentMetadata | null;
        return {
          id: payment.id,
          payment_id: payment.id,
          product_name: payment.product?.name || "Unknown Course",
          product_category: payment.product?.category || "program",
          thinkific_course_url: payment.product?.thinkific_course_url,
          thinkific_enrollment_id: metadata?.thinkific_enrollment_id || null,
          thinkific_user_id: metadata?.thinkific_user_id || null,
          enrolled_at: payment.created_at,
        };
      });

      setEnrollments(enrollmentList);

      // Load progress for enrollments that have Thinkific enrollment IDs
      const enrollmentIds = enrollmentList
        .filter(e => e.thinkific_enrollment_id)
        .map(e => e.thinkific_enrollment_id!);
      
      if (enrollmentIds.length > 0) {
        loadProgress(enrollmentIds);
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (enrollmentIds: number[]) => {
    setLoadingProgress(true);
    try {
      const response = await supabase.functions.invoke("thinkific-progress", {
        body: { enrollment_ids: enrollmentIds },
      });

      if (response.data?.progress) {
        setProgressData(response.data.progress);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "certificate":
        return <Badge variant="default">Certificate</Badge>;
      case "bootcamp":
        return <Badge variant="secondary">Bootcamp</Badge>;
      default:
        return <Badge variant="outline">Program</Badge>;
    }
  };

  const handleContinueLearning = (enrollment: Enrollment) => {
    if (enrollment.thinkific_course_url) {
      window.open(enrollment.thinkific_course_url, "_blank");
    } else {
      window.open(THINKIFIC_SIGNIN_URL, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
          <p className="text-muted-foreground mb-4">
            Start your learning journey by enrolling in one of our programs.
          </p>
          <Button onClick={() => window.location.href = "/learning"}>
            Explore Programs
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            My Enrollments
          </CardTitle>
          <CardDescription>
            Your enrolled courses and programs with progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollments.map((enrollment) => {
              const progress = enrollment.thinkific_enrollment_id 
                ? progressData[enrollment.thinkific_enrollment_id] || 0 
                : 0;

              return (
                <div
                  key={enrollment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{enrollment.product_name}</h4>
                        {getCategoryBadge(enrollment.product_category)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enrolled on {format(new Date(enrollment.enrolled_at), "MMMM d, yyyy")}
                      </p>
                      
                      {/* Progress bar */}
                      {enrollment.thinkific_enrollment_id && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {loadingProgress ? (
                                <Loader2 className="h-3 w-3 animate-spin inline" />
                              ) : (
                                `${Math.round(progress)}%`
                              )}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleContinueLearning(enrollment)}
                      className="gap-2 shrink-0"
                    >
                      <Play className="h-4 w-4" />
                      Continue Learning
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
