export const en = {
  // Hook Scene
  hook: {
    line1: "Still managing bookings",
    line2: "manually",
  },

  // Hero Scene
  hero: {
    headline1: "Automate Your",
    headline2: "Business Operations",
    tagline: "Smart booking, invoicing & AI support — all in one platform",
    cta: "Start Free Trial",
    badges: {
      aiSupport: "24/7 AI Support",
      multiChannel: "Multi-Channel",
      smartScheduling: "Smart Scheduling",
    },
  },

  // Channels Scene
  channels: {
    title: "Reach customers on",
    titleHighlight: "every channel",
    whatsapp: {
      name: "WhatsApp",
      tagline: "#1 messaging worldwide",
    },
    viber: {
      name: "Viber",
      tagline: "Dominate Eastern Europe",
    },
    website: {
      name: "Website Widget",
      tagline: "24/7 on your site",
    },
    mobile: {
      name: "Mobile",
      tagline: "Any device, anywhere",
    },
    newBadge: "NEW",
  },

  // Chat Demo Scene
  chatDemo: {
    title: "Book through",
    titleHighlight: "conversation",
    subtitle: "Your AI assistant handles bookings 24/7, just like chatting with a real receptionist.",
    features: {
      instant: "Instant booking confirmation",
      realtime: "Available slots in real-time",
      reminders: "Automatic reminders sent",
    },
    chat: {
      botName: "BookBot Assistant",
      online: "Online",
      userMessage: "I'd like to book a haircut",
      botResponse: "Sure! Here are available services:",
      serviceName: "Men's Haircut",
      servicePrice: "$35",
      serviceDuration: "45 min",
      availableTimes: "Available times:",
      times: ["9:00 AM", "11:30 AM", "2:00 PM"],
      confirmation: "Booking Confirmed!",
    },
  },

  // Dashboard Scene
  dashboard: {
    title: "Track everything in",
    titleHighlight: "real-time",
    overview: "Dashboard Overview",
    stats: {
      revenue: "Revenue",
      bookings: "Bookings",
      customers: "Customers",
      growth: "Growth",
    },
  },

  // Features Scene
  features: {
    title: "Everything you need to",
    titleHighlight: "grow",
    items: {
      booking: "24/7 Booking",
      ai: "AI Assistant",
      invoicing: "Auto Invoicing",
      discounts: "Smart Discounts",
      channels: "Multi-Channel",
      branding: "Custom Branding",
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Perfect for any industry",
    subtitle: "From salons to consultants, BookBot adapts to your business",
    industries: {
      salons: "Salons",
      clinics: "Clinics",
      fitness: "Fitness",
      beauty: "Beauty",
      consultants: "Consultants",
      photographers: "Photographers",
    },
  },

  // CTA Scene
  cta: {
    line1: "Turn Your Phone Into a",
    line2: "24/7 Receptionist",
    button: "Start Free Trial",
    url: "bookbot.io",
  },
} as const;

export type Translations = typeof en;
