export const whatsappSr = {
  // Hook Scene
  hook: {
    line1: "Jos uvek propustate",
    line2: "WhatsApp poruke klijenata?",
  },

  // Hero Scene
  hero: {
    badge: "Pro + AI",
    headline1: "Pretvorite WhatsApp u Svog",
    headline2: "24/7 Asistenta za Rezervacije",
    subheadline: "Primajte rezervacije direktno preko WhatsApp-a - aplikacije koju vasi klijenti vec koriste",
    cta: "Pocnite da Primate Rezervacije",
    badges: {
      available: "24/7 Dostupan",
      users: "2B+ Korisnika",
      instant: "Instant Odgovori",
    },
  },

  // Demo Scene
  demo: {
    title: "Zakazite Preko",
    titleHighlight: "WhatsApp-a",
    features: {
      natural: "Prirodni razgovor za zakazivanje",
      realTime: "Dostupnost u realnom vremenu",
      instant: "Instant potvrde",
    },
    chat: {
      botName: "BookBot Asistent",
      online: "Online",
      messages: {
        user1: "Zdravo, zelim da zakazem masazu",
        bot1: "Evo nasih dostupnih usluga:",
        user2: "Dubinsku masazu molim, sutra",
        bot2: "Dostupni termini za sutra:",
        user3: "14:00 mi odgovara",
        bot3: "Odlicno! Zakazano za sutra u 14:00",
      },
      services: [
        { name: "Dubinska", price: "8.000 RSD", icon: "spa" },
        { name: "Svedska", price: "6.500 RSD", icon: "relax" },
      ],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Rezervacija Potvrdjena!",
    },
  },

  // Features Scene
  features: {
    title: "Zasto",
    titleHighlight: "WhatsApp?",
    items: {
      availability: {
        title: "24/7 Dostupnost",
        description: "Nikad ne propustite rezervaciju",
      },
      conversations: {
        title: "Prirodni Razgovori",
        description: "Pricajte prirodno, zakazite lako",
      },
      reminders: {
        title: "Automatski Podsetnici",
        description: "Smanjite izostanke za 40%",
      },
      reach: {
        title: "Globalni Domet",
        description: "2B+ WhatsApp korisnika",
      },
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Savrseno za Svaki Biznis",
    subtitle: "Primajte rezervacije gde su vasi klijenti vec",
    items: {
      salons: {
        title: "Spa & Wellness",
        description: "Zakazite u ponoc, opustite se u 9",
      },
      clinics: {
        title: "Medicinske Klinike",
        description: "Prekazite za 30 sekundi",
      },
      consultants: {
        title: "Konsultanti",
        description: "Zakazivanje iz razlicitih vremenskih zona",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Spremni da Primate",
    line2: "WhatsApp Rezervacije?",
    button: "Pocnite Besplatno",
    url: "bookbot.app/whatsapp",
  },
} as const;
