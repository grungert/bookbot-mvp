export const viberEn = {
  // Hook Scene
  hook: {
    line1: "Still missing customer",
    line2: "Viber messages?",
  },

  // Hero Scene
  hero: {
    badge: "Pro + AI",
    headline1: "Reach Eastern Europe",
    headline2: "Through Viber",
    subheadline: "Accept bookings directly through Viber - the #1 messaging app in Serbia and Eastern Europe",
    cta: "Start Accepting Bookings",
    badges: {
      available: "24/7 Available",
      users: "#1 in Serbia",
      instant: "Instant Responses",
    },
  },

  // Demo Scene - Dental clinic with "tomorrow booked" flow
  demo: {
    title: "Book Through",
    titleHighlight: "Viber",
    features: {
      natural: "Natural conversation booking",
      realTime: "Real-time availability",
      instant: "Instant confirmations",
    },
    chat: {
      botName: "BookBot Assistant",
      online: "Online",
      messages: {
        user1: "Hi, I need a dental checkup",
        bot1: "Here are our available services:",
        user2: "Checkup for tomorrow please",
        bot2: "Tomorrow is fully booked. Available dates:",
        user3: "Thursday works",
        bot3: "Great! Times for Thursday:",
        user4: "10:00 please",
        bot4: "Perfect! You're booked for Thursday at 10:00",
      },
      services: [
        { name: "Checkup", price: "$50", icon: "spa" },
        { name: "Cleaning", price: "$80", icon: "relax" },
      ],
      dates: ["Wed 5th", "Thu 6th", "Fri 7th"],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Booking Confirmed!",
    },
  },

  // Features Scene
  features: {
    title: "Why",
    titleHighlight: "Viber?",
    items: {
      dominance: {
        title: "Regional Dominance",
        description: "#1 in Serbia & Eastern Europe",
      },
      availability: {
        title: "24/7 Availability",
        description: "Never miss a booking",
      },
      conversations: {
        title: "Natural Conversations",
        description: "Chat naturally, book easily",
      },
      reminders: {
        title: "Automatic Reminders",
        description: "Reduce no-shows by 40%",
      },
    },
  },

  // Use Cases Scene - Different from salon/massage
  useCases: {
    title: "Perfect for Any Business",
    subtitle: "Accept bookings where your customers already are",
    items: {
      dental: {
        title: "Dental Clinics",
        description: "Reduced missed appointments 50%",
      },
      fitness: {
        title: "Fitness Studios",
        description: "Class bookings up 3x",
      },
      auto: {
        title: "Auto Services",
        description: "24/7 service scheduling",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Ready to Accept",
    line2: "Viber Bookings?",
    button: "Get Started Free",
    url: "bookbot.app/viber",
  },
} as const;

export type ViberTranslations = typeof viberEn;
