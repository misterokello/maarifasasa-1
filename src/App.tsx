
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import PopupRenderer from "./components/PopupRenderer";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import LearningPrograms from "./pages/Learning";
import Academy from "./pages/Academy";
import CourseDetailPage from "./pages/CourseDetail";
import AdminCourses from "./pages/AdminCourses";
import AdminPopups from "./pages/AdminPopups";
import AdminMedia from "./pages/AdminMedia";
import AdminBlog from "./pages/AdminBlog";
import AdminComments from "./pages/AdminComments";
import AdminUsers from "./pages/AdminUsers";
import AdminUserDetail from "./pages/AdminUserDetail";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import LearnAndEarn from "./pages/LearnAndEarn";
import DigitalEntrepreneurship from "./pages/DigitalEntrepreneurship";
import DigitalFieldAgents from "./pages/DigitalFieldAgents";
import TenXProgramme from "./pages/TenXProgramme";
import AgencyProgramme from "./pages/AgencyProgramme";
import TalentAccelerator from "./pages/TalentAccelerator";
import PartnerPrograms from "./pages/PartnerPrograms";
import Bootcamps from "./pages/Bootcamps";
import AdvancedCertificates from "./pages/AdvancedCertificates";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import BlogEditorNew from "./pages/BlogEditorNew";
import BlogEditorEdit from "./pages/BlogEditorEdit";
import BlogAdminDashboard from "./pages/BlogAdminDashboard";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import ResetPassword from "./pages/ResetPassword";
import AdminProfileFields from "./pages/AdminProfileFields";
import Advisor from "./pages/Advisor";
import AdvisorResult from "./pages/AdvisorResult";
import AdminAdvisorDashboard from "./pages/admin/advisor/AdminAdvisorDashboard";
import AdminIntegrations from "./pages/AdminIntegrations";
import AdminEngagement from "./pages/AdminEngagement";
import HiringDashboard from "./pages/admin/HiringDashboard";
import AdminAccess from "./pages/AdminAccess";
import AdminLearners from "./pages/AdminLearners";
import AdminEnquiries from "./pages/AdminEnquiries";
import AdminDiscounts from "./pages/AdminDiscounts";
import AdminPayouts from "./pages/AdminPayouts";
import AdminPaymentsAudit from "./pages/AdminPaymentsAudit";
import PartnerApply from "./pages/PartnerApply";
import Partners from "./pages/Partners";
import PartnerPortal from "./pages/PartnerPortal";
import OrganisationPortal from "./pages/OrganisationPortal";
import Careers from "./pages/Careers";
import CareerDetail from "./pages/CareerDetail";
import HrAdminGuard from "./components/HrAdminGuard";
import AuthGuard from "./components/AuthGuard";
import AdminGuard from "./components/AdminGuard";
import BlogAdminGuard from "./components/BlogAdminGuard";
import ModuleGuard from "./components/ModuleGuard";
import WhatsAppButton from "./components/WhatsAppButton";
import { useRefClickTracker } from "./hooks/useRefClickTracker";
import { AuthProvider } from "./hooks/useAuth";
import { trackPageView } from "./lib/analytics";

const queryClient = new QueryClient();

const AppInner = () => {
  useRefClickTracker();
  const location = useLocation();

  // Send a page view on every client-side route change.
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <div className="flex flex-col min-h-screen">
      <PopupRenderer />
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/learning" element={<LearningPrograms />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/:slug" element={<CourseDetailPage />} />
          <Route path="/learn-and-earn" element={<LearnAndEarn />} />
          <Route path="/digital-entrepreneurship" element={<DigitalEntrepreneurship />} />
          <Route path="/programs" element={<Navigate to="/learning" replace />} />
          <Route path="/programs/talent-accelerator" element={<TalentAccelerator />} />
          <Route path="/programs/partner-programs" element={<PartnerPrograms />} />
          <Route path="/programs/bootcamps" element={<Bootcamps />} />
          <Route path="/programs/certificates" element={<AdvancedCertificates />} />
          <Route path="/programs/digital-field-agents" element={<DigitalFieldAgents />} />
          <Route path="/programs/10x-programme" element={<TenXProgramme />} />
          <Route path="/programs/agency-programme" element={<AgencyProgramme />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/blog/category/:slug" element={<BlogCategory />} />

          {/* AI Pathway Advisor */}
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/advisor/r/:code" element={<AdvisorResult />} />

          {/* Checkout Routes */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />

          {/* Protected Admin Routes - require admin role */}
          <Route path="/super-admin-dashboard" element={<AdminGuard><SuperAdminDashboard /></AdminGuard>} />
          <Route path="/admin-courses" element={<ModuleGuard roles={["products_admin"]} moduleName="Products"><AdminCourses /></ModuleGuard>} />
          <Route path="/admin-users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
          <Route path="/admin-users/:userId" element={<AdminGuard><AdminUserDetail /></AdminGuard>} />
          <Route path="/admin-access" element={<AdminGuard><AdminAccess /></AdminGuard>} />
          <Route path="/admin-learners" element={<AdminGuard><AdminLearners /></AdminGuard>} />
          <Route path="/admin-enquiries" element={<AdminGuard><AdminEnquiries /></AdminGuard>} />
          <Route
            path="/admin-discounts"
            element={
              <ModuleGuard roles={["discount_admin"]} moduleName="Discounts">
                <AdminDiscounts />
              </ModuleGuard>
            }
          />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/apply" element={<PartnerApply />} />
          <Route
            path="/admin-payouts"
            element={
              <ModuleGuard roles={["affiliate_admin", "discount_admin", "payments_admin"]} moduleName="Payouts">
                <AdminPayouts />
              </ModuleGuard>
            }
          />
          <Route
            path="/admin-payments-audit"
            element={
              <ModuleGuard roles={["payments_admin"]} moduleName="Payments Audit">
                <AdminPaymentsAudit />
              </ModuleGuard>
            }
          />

          <Route path="/partners/portal" element={<PartnerPortal />} />
          <Route
            path="/organisation-portal"
            element={
              <ModuleGuard roles={["partner_admin", "learner_admin"]} moduleName="the organisation portal">
                <OrganisationPortal />
              </ModuleGuard>
            }
          />
          <Route path="/admin-profile-fields" element={<ModuleGuard roles={["learner_admin"]} moduleName="Profile Fields"><AdminProfileFields /></ModuleGuard>} />
          <Route path="/admin-popups" element={<ModuleGuard roles={["popups_admin"]} moduleName="Popups"><AdminPopups /></ModuleGuard>} />
          <Route path="/admin-media" element={<ModuleGuard roles={["blog_admin"]} moduleName="Media Features"><AdminMedia /></ModuleGuard>} />
          <Route path="/admin/comments" element={<Navigate to="/blog-admin?tab=comments" replace />} />
          <Route path="/admin/advisor" element={<ModuleGuard roles={["advisor_admin"]} moduleName="AI Advisor"><AdminAdvisorDashboard /></ModuleGuard>} />
          <Route path="/admin/integrations" element={<AdminGuard><AdminIntegrations /></AdminGuard>} />
          <Route path="/admin-engagement" element={<ModuleGuard roles={["engagement_admin"]} moduleName="Engagement"><AdminEngagement /></ModuleGuard>} />
          <Route path="/admin-hiring" element={<HrAdminGuard><HiringDashboard /></HrAdminGuard>} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/careers/:slug" element={<CareerDetail />} />

          {/* Protected Blog Admin Routes - require blog_admin or admin role */}
          <Route path="/blog-admin" element={<BlogAdminGuard><BlogAdminDashboard /></BlogAdminGuard>} />
          <Route path="/blog-editor/new" element={<BlogAdminGuard><BlogEditorNew /></BlogAdminGuard>} />
          <Route path="/blog-editor/edit/:slug" element={<BlogAdminGuard><BlogEditorEdit /></BlogAdminGuard>} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/">
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
