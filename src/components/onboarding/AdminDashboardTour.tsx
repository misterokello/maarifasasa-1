import React from "react";
import { Shield } from "lucide-react";
import OnboardingTour, { TourStep } from "./OnboardingTour";

const adminSteps: TourStep[] = [
  {
    target: '[value="overview"]',
    title: "Dashboard Overview",
    description:
      "Get a bird's-eye view of platform performance — revenue, payments, blog views, and affiliate stats all in one place.",
    placement: "bottom",
  },
  {
    target: '[value="payments"]',
    title: "Payment Management",
    description:
      "Track all payment transactions, filter by status, and export payment data for your records.",
    placement: "bottom",
  },
  {
    target: '[value="forms"]',
    title: "Form Submissions",
    description:
      "View and manage Tally form submissions from your site — enrollment requests, feedback, and more.",
    placement: "bottom",
  },
  {
    target: '[value="users"]',
    title: "User Management",
    description:
      "Manage admin users, assign roles, and control access permissions for your team.",
    placement: "bottom",
  },
  {
    target: '[value="affiliates"]',
    title: "Affiliate Program",
    description:
      "Review affiliate applications, manage commissions, and track referral performance.",
    placement: "bottom",
  },
  {
    target: 'a[href="/admin-courses"]',
    title: "Product Management",
    description:
      "Create and manage certificates, bootcamps, and programs. Set pricing, link to Thinkific courses, and toggle availability.",
    placement: "right",
  },
  {
    target: 'a[href="/admin-popups"]',
    title: "Popup Manager",
    description:
      "Create promotional popups, banners, and Tally form embeds. Configure display rules and track engagement analytics.",
    placement: "right",
  },
  {
    target: 'a[href="/blog-admin"]',
    title: "Blog & Content",
    description:
      "Write blog posts, manage categories, moderate comments, and track article performance.",
    placement: "right",
  },
];

const AdminDashboardTour = () => (
  <OnboardingTour
    tourId="admin-dashboard"
    welcome={{
      title: "Welcome, Admin! 🚀",
      subtitle: "Let's explore your control center",
      description:
        "This quick tour will walk you through the key admin features — from analytics and payments to content and user management. Takes about 45 seconds!",
      icon: <Shield className="h-8 w-8 text-primary" />,
    }}
    steps={adminSteps}
  />
);

export default AdminDashboardTour;
