import type { Translations } from "./en";

export const sr: Translations = {
  // Hook Scene
  hook: {
    line1: "Još uvek zakazujete termine",
    line2: "ručno",
  },

  // Hero Scene
  hero: {
    headline1: "Automatizujte Vaše",
    headline2: "Poslovanje",
    tagline: "Pametno zakazivanje, fakturisanje i AI podrška — sve na jednom mestu",
    cta: "Započnite Besplatno",
    badges: {
      aiSupport: "24/7 AI Podrška",
      multiChannel: "Više Kanala",
      smartScheduling: "Pametno Zakazivanje",
    },
  },

  // Channels Scene
  channels: {
    title: "Dosegnite klijente na",
    titleHighlight: "svakom kanalu",
    whatsapp: {
      name: "WhatsApp",
      tagline: "#1 aplikacija za poruke",
    },
    viber: {
      name: "Viber",
      tagline: "Dominira u Istočnoj Evropi",
    },
    website: {
      name: "Web Widget",
      tagline: "24/7 na vašem sajtu",
    },
    mobile: {
      name: "Mobilni",
      tagline: "Bilo koji uređaj, bilo gde",
    },
    newBadge: "NOVO",
  },

  // Chat Demo Scene
  chatDemo: {
    title: "Zakažite kroz",
    titleHighlight: "razgovor",
    subtitle: "Vaš AI asistent obrađuje rezervacije 24/7, kao da razgovarate sa pravim recepcionerom.",
    features: {
      instant: "Trenutna potvrda rezervacije",
      realtime: "Dostupni termini u realnom vremenu",
      reminders: "Automatski podsetnici",
    },
    chat: {
      botName: "BookBot Asistent",
      online: "Online",
      userMessage: "Želim da zakažem šišanje",
      botResponse: "Naravno! Evo dostupnih usluga:",
      serviceName: "Muško šišanje",
      servicePrice: "2.500 RSD",
      serviceDuration: "45 min",
      availableTimes: "Dostupni termini:",
      times: ["9:00", "11:30", "14:00"],
      confirmation: "Rezervacija Potvrđena!",
    },
  },

  // Dashboard Scene
  dashboard: {
    title: "Pratite sve u",
    titleHighlight: "realnom vremenu",
    overview: "Pregled Kontrolne Table",
    stats: {
      revenue: "Prihod",
      bookings: "Rezervacije",
      customers: "Klijenti",
      growth: "Rast",
    },
  },

  // Features Scene
  features: {
    title: "Sve što vam treba za",
    titleHighlight: "rast",
    items: {
      booking: "24/7 Zakazivanje",
      ai: "AI Asistent",
      invoicing: "Auto Fakture",
      discounts: "Pametni Popusti",
      channels: "Više Kanala",
      branding: "Prilagođen Brend",
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Savršeno za svaku industriju",
    subtitle: "Od salona do konsultanata, BookBot se prilagođava vašem poslu",
    industries: {
      salons: "Saloni",
      clinics: "Klinike",
      fitness: "Fitness",
      beauty: "Lepota",
      consultants: "Konsultanti",
      photographers: "Fotografi",
    },
  },

  // CTA Scene
  cta: {
    line1: "Pretvorite Vaš Telefon u",
    line2: "24/7 Recepciju",
    button: "Započnite Besplatno",
    url: "bookbot.io",
  },
} as const;
