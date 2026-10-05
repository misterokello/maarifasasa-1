import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";
import { DiscountCodesList } from "@/components/admin/discounts/DiscountCodesList";
import { DiscountLeaderboard } from "@/components/admin/discounts/DiscountLeaderboard";
import { DiscountApplications } from "@/components/admin/discounts/DiscountApplications";
import { DiscountRedemptions } from "@/components/admin/discounts/DiscountRedemptions";

const AdminDiscounts = () => (
  <AdminDashboardLayout
    title="Discount Codes & Referrals"
    subtitle="Create codes, onboard partners, and track every signup and sale they drive"
  >
    <Helmet>
      <title>Discount Codes & Referrals | Maarifasasa Admin</title>
      <meta name="robots" content="noindex" />
    </Helmet>

    <Tabs defaultValue="codes">
      <TabsList className="bg-muted/50 mb-6">
        <TabsTrigger value="codes">Codes</TabsTrigger>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
      </TabsList>

      <TabsContent value="codes" className="mt-0">
        <DiscountCodesList />
      </TabsContent>
      <TabsContent value="leaderboard" className="mt-0">
        <DiscountLeaderboard />
      </TabsContent>
      <TabsContent value="applications" className="mt-0">
        <DiscountApplications />
      </TabsContent>
      <TabsContent value="redemptions" className="mt-0">
        <DiscountRedemptions />
      </TabsContent>
    </Tabs>
  </AdminDashboardLayout>
);

export default AdminDiscounts;