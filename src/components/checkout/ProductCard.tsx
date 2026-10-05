import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { CourseOutline } from "./CourseOutline";
import { CourseBenefits } from "./CourseBenefits";
import DOMPurify from "dompurify";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_ugx: number;
  price_usd: number;
  category: string;
}

interface Lesson {
  name: string;
  content_type?: string | null;
}

interface Chapter {
  name: string;
  contents_count: number;
  lessons?: Lesson[];
}

export interface CourseDetail {
  name: string;
  description: string | null;
  course_card_image_url: string | null;
  banner_image_url: string | null;
  chapters: Chapter[];
  user_count: number;
  course_card_text?: string | null;
  keywords?: string | null;
  instructional_level?: string | null;
  duration?: string | null;
}

interface ProductCardProps {
  product: Product;
  selectedLocation: "uganda" | "international";
  courseDetail?: CourseDetail | null;
  courseDetailLoading?: boolean;
}

export function ProductCard({ product, selectedLocation, courseDetail, courseDetailLoading }: ProductCardProps) {
  const formatUGX = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const imageUrl = courseDetail?.course_card_image_url || courseDetail?.banner_image_url;
  const richDescription = courseDetail?.description;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/30 overflow-hidden">
      {/* Course image */}
      {courseDetailLoading && (
        <Skeleton className="w-full h-48 rounded-none" />
      )}
      {!courseDetailLoading && imageUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">{product.category}</Badge>
              {courseDetail && courseDetail.user_count > 0 && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {courseDetail.user_count.toLocaleString()} students
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            {selectedLocation === "uganda" ? (
              <>
                <p className="text-3xl font-bold text-primary">{formatUGX(product.price_ugx)}</p>
                <p className="text-sm text-muted-foreground">({formatUSD(product.price_usd)})</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-primary">{formatUSD(product.price_usd)}</p>
                <p className="text-sm text-muted-foreground">({formatUGX(product.price_ugx)})</p>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Description: prefer rich Thinkific description, fallback to product description */}
        {courseDetailLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {!courseDetailLoading && richDescription ? (
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(richDescription) }}
          />
        ) : (
          !courseDetailLoading && product.description && (
            <CardDescription className="text-base">{product.description}</CardDescription>
          )
        )}

        {/* Benefits / highlights */}
        {!courseDetailLoading && courseDetail && (
          <CourseBenefits
            description={courseDetail.description}
            cardText={courseDetail.course_card_text}
            keywords={courseDetail.keywords}
            instructionalLevel={courseDetail.instructional_level}
            duration={courseDetail.duration}
            totalLessons={courseDetail.chapters.reduce((s, c) => s + c.contents_count, 0)}
          />
        )}

        {/* Course outline */}
        {courseDetailLoading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!courseDetailLoading && courseDetail && courseDetail.chapters.length > 0 && (
          <CourseOutline chapters={courseDetail.chapters} />
        )}
      </CardContent>
    </Card>
  );
}
