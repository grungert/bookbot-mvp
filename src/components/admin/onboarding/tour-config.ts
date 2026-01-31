export interface TourStep {
  id: string;
  targetSelector: string;
  titleKey: string;
  contentKey: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const tourSteps: TourStep[] = [
  {
    id: "company-switcher",
    targetSelector: '[data-tour="company-switcher"]',
    titleKey: "onboarding.tour.companySwitcher.title",
    contentKey: "onboarding.tour.companySwitcher.content",
    position: "right",
  },
  {
    id: "my-appointments",
    targetSelector: '[data-tour="my-appointments"]',
    titleKey: "onboarding.tour.myAppointments.title",
    contentKey: "onboarding.tour.myAppointments.content",
    position: "bottom",
  },
  {
    id: "admin-link",
    targetSelector: '[data-tour="admin-link"]',
    titleKey: "onboarding.tour.adminLink.title",
    contentKey: "onboarding.tour.adminLink.content",
    position: "bottom",
  },
  {
    id: "dashboard",
    targetSelector: '[data-tour="dashboard"]',
    titleKey: "onboarding.tour.dashboard.title",
    contentKey: "onboarding.tour.dashboard.content",
    position: "right",
  },
  {
    id: "services",
    targetSelector: '[data-tour="services"]',
    titleKey: "onboarding.tour.services.title",
    contentKey: "onboarding.tour.services.content",
    position: "right",
  },
  {
    id: "working-hours",
    targetSelector: '[data-tour="working-hours"]',
    titleKey: "onboarding.tour.workingHours.title",
    contentKey: "onboarding.tour.workingHours.content",
    position: "right",
  },
  {
    id: "appointments",
    targetSelector: '[data-tour="appointments"]',
    titleKey: "onboarding.tour.appointments.title",
    contentKey: "onboarding.tour.appointments.content",
    position: "right",
  },
  {
    id: "invoices",
    targetSelector: '[data-tour="invoices"]',
    titleKey: "onboarding.tour.invoices.title",
    contentKey: "onboarding.tour.invoices.content",
    position: "right",
  },
  {
    id: "conversations",
    targetSelector: '[data-tour="conversations"]',
    titleKey: "onboarding.tour.conversations.title",
    contentKey: "onboarding.tour.conversations.content",
    position: "right",
  },
  {
    id: "documents",
    targetSelector: '[data-tour="documents"]',
    titleKey: "onboarding.tour.documents.title",
    contentKey: "onboarding.tour.documents.content",
    position: "right",
  },
  {
    id: "profile",
    targetSelector: '[data-tour="profile"]',
    titleKey: "onboarding.tour.profile.title",
    contentKey: "onboarding.tour.profile.content",
    position: "right",
  },
  {
    id: "settings",
    targetSelector: '[data-tour="settings"]',
    titleKey: "onboarding.tour.settings.title",
    contentKey: "onboarding.tour.settings.content",
    position: "right",
  },
];
