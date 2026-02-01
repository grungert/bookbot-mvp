export const mobileEn = {
  // Hook Scene
  hook: {
    line1: "Stuck at your desk",
    line2: "managing bookings?",
  },

  // Hero Scene
  hero: {
    badge: "Pro + Mobile",
    headline1: "Manage Your Business",
    headline2: "From Anywhere",
    subheadline: "Full dashboard access from any device - confirm bookings, view stats, and stay in control on the go",
    cta: "Try Mobile Dashboard",
    badges: {
      available: "24/7 Access",
      noApp: "No App Required",
      realTime: "Real-Time Updates",
    },
  },

  // Demo Scene - Dashboard with notification flow
  demo: {
    title: "Your Business",
    titleHighlight: "In Your Pocket",
    features: {
      notifications: "Real-time notifications",
      oneTap: "One-tap confirmations",
      calendar: "Full calendar access",
    },
    dashboard: {
      header: "Dashboard",
      statsToday: "Today",
      statsWeek: "This Week",
      todayCount: "5",
      weekCount: "23",
      notification: {
        title: "New Booking Request",
        subtitle: "Maria S. - Haircut",
      },
      appointment: {
        name: "Maria S.",
        service: "Haircut",
        time: "Tomorrow, 10:00 AM",
      },
      confirmButton: "Confirm",
      confirmed: "Confirmed!",
    },
  },

  // Features Scene
  features: {
    title: "Why Go",
    titleHighlight: "Mobile?",
    items: {
      responsive: {
        title: "Responsive Design",
        description: "Works on any screen size",
      },
      alerts: {
        title: "Real-Time Alerts",
        description: "Instant booking notifications",
      },
      quickActions: {
        title: "Quick Actions",
        description: "Confirm with a single tap",
      },
      noDownload: {
        title: "No Download",
        description: "Works in your browser",
      },
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Stay Productive Anywhere",
    subtitle: "Manage your business in minutes, not hours",
    items: {
      between: {
        title: "Between Appointments",
        description: "Quick check during coffee break",
      },
      traveling: {
        title: "While Traveling",
        description: "Stay productive anywhere",
      },
      afterHours: {
        title: "After Hours",
        description: "Review tomorrow in 2 minutes",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Ready to Go",
    line2: "Mobile?",
    button: "Get Started Free",
    url: "bookbot.app/mobile",
  },
} as const;

export type MobileTranslations = typeof mobileEn;
