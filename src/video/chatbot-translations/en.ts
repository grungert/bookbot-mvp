export const chatbotEn = {
  // Hook Scene
  hook: {
    line1: "Still answering the same",
    line2: "questions over and over",
  },

  // Hero Scene
  hero: {
    badge: "AI-Powered",
    headline1: "Your Website's",
    headline2: "24/7 Assistant",
    subheadline: "Answer questions, capture leads, and book appointments — even while you sleep",
    cta: "Add to Your Website",
    badges: {
      support: "24/7 Support",
      noForms: "No Forms Needed",
      instant: "Instant Answers",
    },
  },

  // Installation Demo Scene
  installDemo: {
    title: "One Line of",
    titleHighlight: "Code",
    subtitle: "Add the chatbot to any website in seconds",
    code: '<script src="https://bookbot.app/widget.js"></script>',
    copied: "Copied!",
    platforms: {
      wordpress: "WordPress",
      shopify: "Shopify",
      wix: "Wix",
      squarespace: "Squarespace",
    },
  },

  // Live Chat Demo Scene
  liveChatDemo: {
    title: "Book Through",
    titleHighlight: "Conversation",
    chat: {
      botName: "BookBot Assistant",
      online: "Online",
      messages: {
        user1: "What services do you offer?",
        bot1: "Here are our services:",
        user2: "Book haircut for tomorrow",
        bot2: "Available times tomorrow:",
        user3: "10:00 works",
        bot3: "Booked for tomorrow 10:00",
      },
      services: [
        { name: "Haircut", price: "$25", icon: "scissors" },
        { name: "Styling", price: "$40", icon: "brush" },
      ],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Booking Confirmed!",
    },
  },

  // Features Scene
  features: {
    title: "Everything You",
    titleHighlight: "Need",
    items: {
      install: {
        title: "One-Line Install",
        description: "Copy, paste, done",
      },
      brand: {
        title: "Matches Your Brand",
        description: "Customize colors & style",
      },
      knowledge: {
        title: "Knowledge Base",
        description: "Train on your content",
      },
      available: {
        title: "24/7 Available",
        description: "Never miss a lead",
      },
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Perfect for Any Business",
    subtitle: "Handle customer inquiries automatically",
    items: {
      afterHours: {
        title: "After-Hours Support",
        description: "Visitors at 2am can still book",
      },
      leads: {
        title: "Lead Qualification",
        description: "AI asks qualifying questions",
      },
      answers: {
        title: "Instant Answers",
        description: "Answer FAQs in seconds",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Add AI Support to",
    line2: "Your Website Today",
    button: "Get Started Free",
    url: "bookbot.app/chatbot",
  },
} as const;

export type ChatbotTranslations = typeof chatbotEn;
