import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCategory } from "@/lib/api/products";
import BootcampCohortCard from "./BootcampCohortCard";
import { Skeleton } from "@/components/ui/skeleton";

const BootcampCohortsGrid = () => {
  const { data: bootcamps, isLoading, error } = useQuery({
    queryKey: ["products", "bootcamp"],
    queryFn: () => fetchProductsByCategory("bootcamp"),
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 p-6 border rounded-xl">
            <Skeleton className="h-6 w-24 mx-auto" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load bootcamps. Please try again later.</p>
      </div>
    );
  }

  if (!bootcamps || bootcamps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No bootcamp cohorts currently open. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {bootcamps.map((bootcamp) => (
        <BootcampCohortCard key={bootcamp.id} product={bootcamp} />
      ))}
    </div>
  );
};

export default BootcampCohortsGrid;
