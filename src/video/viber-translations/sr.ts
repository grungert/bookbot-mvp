export const viberSr = {
  // Hook Scene
  hook: {
    line1: "Jos uvek propustate",
    line2: "Viber poruke klijenata?",
  },

  // Hero Scene
  hero: {
    badge: "Pro + AI",
    headline1: "Dosegnite Klijente",
    headline2: "Kroz Viber",
    subheadline: "Primajte rezervacije direktno preko Viber-a - #1 aplikacije u Srbiji i Istocnoj Evropi",
    cta: "Pocnite da Primate Rezervacije",
    badges: {
      available: "24/7 Dostupan",
      users: "#1 u Srbiji",
      instant: "Instant Odgovori",
    },
  },

  // Demo Scene - Dental clinic with "tomorrow booked" flow
  demo: {
    title: "Zakazite Preko",
    titleHighlight: "Viber-a",
    features: {
      natural: "Prirodni razgovor za zakazivanje",
      realTime: "Dostupnost u realnom vremenu",
      instant: "Instant potvrde",
    },
    chat: {
      botName: "BookBot Asistent",
      online: "Online",
      messages: {
        user1: "Zdravo, treba mi pregled zuba",
        bot1: "Evo nasih dostupnih usluga:",
        user2: "Pregled za sutra molim",
        bot2: "Sutra smo popunjeni. Dostupni datumi:",
        user3: "Cetvrtak mi odgovara",
        bot3: "Odlicno! Termini za cetvrtak:",
        user4: "10:00 molim",
        bot4: "Sjajno! Zakazano za cetvrtak u 10:00",
      },
      services: [
        { name: "Pregled", price: "5.000 RSD", icon: "spa" },
        { name: "Ciscenje", price: "8.000 RSD", icon: "relax" },
      ],
      dates: ["Sre 5.", "Cet 6.", "Pet 7."],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Rezervacija Potvrdjena!",
    },
  },

  // Features Scene
  features: {
    title: "Zasto",
    titleHighlight: "Viber?",
    items: {
      dominance: {
        title: "Regionalna Dominacija",
        description: "#1 u Srbiji i Istocnoj Evropi",
      },
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
    },
  },

  // Use Cases Scene - Different from salon/massage
  useCases: {
    title: "Savrseno za Svaki Biznis",
    subtitle: "Primajte rezervacije gde su vasi klijenti vec",
    items: {
      dental: {
        title: "Stomatoloske Ordinacije",
        description: "Smanjeni propusteni termini za 50%",
      },
      fitness: {
        title: "Fitness Studiji",
        description: "Rezervacije casova porasle 3x",
      },
      auto: {
        title: "Auto Servisi",
        description: "24/7 zakazivanje servisa",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Spremni da Primate",
    line2: "Viber Rezervacije?",
    button: "Pocnite Besplatno",
    url: "bookbot.app/viber",
  },
} as const;
