export const whatsappEn = {
  // Hook Scene
  hook: {
    line1: "Still missing customer",
    line2: "WhatsApp messages?",
  },

  // Hero Scene
  hero: {
    badge: "Pro + AI",
    headline1: "Turn WhatsApp Into Your",
    headline2: "24/7 Booking Assistant",
    subheadline: "Accept bookings directly through WhatsApp - the app your customers already love",
    cta: "Start Accepting Bookings",
    badges: {
      available: "24/7 Available",
      users: "2B+ Users",
      instant: "Instant Responses",
    },
  },

  // Demo Scene
  demo: {
    title: "Book Through",
    titleHighlight: "WhatsApp",
    features: {
      natural: "Natural conversation booking",
      realTime: "Real-time availability",
      instant: "Instant confirmations",
    },
    chat: {
      botName: "BookBot Assistant",
      online: "Online",
      messages: {
        user1: "Hi, I'd like to book a massage",
        bot1: "Here are our available services:",
        user2: "Deep tissue please, tomorrow",
        bot2: "Available times for tomorrow:",
        user3: "14:00 works great",
        bot3: "Perfect! You're all set for tomorrow at 14:00",
      },
      services: [
        { name: "Deep Tissue", price: "$80", icon: "spa" },
        { name: "Swedish", price: "$65", icon: "relax" },
      ],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Booking Confirmed!",
    },
  },

  // Features Scene
  features: {
    title: "Why",
    titleHighlight: "WhatsApp?",
    items: {
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
      reach: {
        title: "Global Reach",
        description: "2B+ WhatsApp users",
      },
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Perfect for Any Business",
    subtitle: "Accept bookings where your customers already are",
    items: {
      salons: {
        title: "Spa & Wellness",
        description: "Book at midnight, relax at 9am",
      },
      clinics: {
        title: "Medical Clinics",
        description: "Reschedule in 30 seconds",
      },
      consultants: {
        title: "Consultants",
        description: "International timezone booking",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Ready to Accept",
    line2: "WhatsApp Bookings?",
    button: "Get Started Free",
    url: "bookbot.app/whatsapp",
  },
} as const;

export type WhatsAppTranslations = typeof whatsappEn;
