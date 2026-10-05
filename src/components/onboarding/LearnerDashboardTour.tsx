import React from "react";
import { GraduationCap } from "lucide-react";
import OnboardingTour, { TourStep } from "./OnboardingTour";

const learnerSteps: TourStep[] = [
  {
    target: '[value="enrollments"]',
    title: "My Learning",
    description:
      "View all your enrolled courses, track progress, and access your learning materials directly from here.",
    placement: "bottom",
  },
  {
    target: '[value="products"]',
    title: "Explore Programs",
    description:
      "Browse available certificates, bootcamps, and programs. Enroll in new courses to grow your skills.",
    placement: "bottom",
  },
  {
    target: '[value="payments"]',
    title: "Payment History",
    description:
      "Review all your past payments, receipts, and transaction details in one place.",
    placement: "bottom",
  },
  {
    target: '[value="profile"]',
    title: "Your Profile",
    description:
      "Update your personal information, upload a profile photo, and manage your learning preferences.",
    placement: "bottom",
  },
];

const LearnerDashboardTour = () => (
  <OnboardingTour
    tourId="learner-dashboard"
    welcome={{
      title: "Welcome to Your Dashboard! 🎓",
      subtitle: "Your learning journey starts here",
      description:
        "We'll give you a quick tour of the key features so you can get the most out of your learning experience. It only takes 30 seconds!",
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
    }}
    steps={learnerSteps}
  />
);

export default LearnerDashboardTour;
