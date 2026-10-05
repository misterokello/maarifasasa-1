import { useQuery } from "@tanstack/react-query";
import { fetchProductsByCategory } from "@/lib/api/products";
import CertificateCard from "./CertificateCard";
import { Skeleton } from "@/components/ui/skeleton";

const CertificatesGrid = () => {
  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ["products", "certificate"],
    queryFn: () => fetchProductsByCategory("certificate"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load certificates. Please try again later.</p>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No certificates available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((cert) => (
        <CertificateCard key={cert.id} product={cert} />
      ))}
    </div>
  );
};

export default CertificatesGrid;
