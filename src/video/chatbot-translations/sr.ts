import type { ChatbotTranslations } from "./en";

export const chatbotSr: ChatbotTranslations = {
  // Hook Scene
  hook: {
    line1: "Još uvek odgovarate na ista",
    line2: "pitanja iznova i iznova",
  },

  // Hero Scene
  hero: {
    badge: "AI Tehnologija",
    headline1: "Vaš Virtuelni",
    headline2: "24/7 Asistent",
    subheadline: "Odgovarajte na pitanja, prikupljajte kontakte i zakazujte termine — čak i dok spavate",
    cta: "Dodajte na Vaš Sajt",
    badges: {
      support: "24/7 Podrška",
      noForms: "Bez Formulara",
      instant: "Instant Odgovori",
    },
  },

  // Installation Demo Scene
  installDemo: {
    title: "Jedna Linija",
    titleHighlight: "Koda",
    subtitle: "Dodajte chatbot na bilo koji sajt za nekoliko sekundi",
    code: '<script src="https://bookbot.app/widget.js"></script>',
    copied: "Kopirano!",
    platforms: {
      wordpress: "WordPress",
      shopify: "Shopify",
      wix: "Wix",
      squarespace: "Squarespace",
    },
  },

  // Live Chat Demo Scene
  liveChatDemo: {
    title: "Zakažite Kroz",
    titleHighlight: "Razgovor",
    chat: {
      botName: "BookBot Asistent",
      online: "Online",
      messages: {
        user1: "Koje usluge nudite?",
        bot1: "Evo naših usluga:",
        user2: "Zakaži šišanje za sutra",
        bot2: "Dostupni termini za sutra:",
        user3: "10:00 mi odgovara",
        bot3: "Zakazano za sutra u 10:00",
      },
      services: [
        { name: "Šišanje", price: "2.500 RSD", icon: "scissors" },
        { name: "Stilizovanje", price: "4.000 RSD", icon: "brush" },
      ],
      times: ["10:00", "14:00", "16:00"],
      confirmation: "Rezervacija Potvrđena!",
    },
  },

  // Features Scene
  features: {
    title: "Sve Što Vam",
    titleHighlight: "Treba",
    items: {
      install: {
        title: "Instalacija u Sekundi",
        description: "Kopiraj, nalepi, gotovo",
      },
      brand: {
        title: "Prilagođen Brendu",
        description: "Prilagodite boje i stil",
      },
      knowledge: {
        title: "Baza Znanja",
        description: "Obučite na vašem sadržaju",
      },
      available: {
        title: "24/7 Dostupan",
        description: "Nikad ne propustite kontakt",
      },
    },
  },

  // Use Cases Scene
  useCases: {
    title: "Savršeno za Svaki Biznis",
    subtitle: "Automatski obrađujte upite klijenata",
    items: {
      afterHours: {
        title: "Podrška van Radnog Vremena",
        description: "Posetioci u 2 ujutru mogu zakazati",
      },
      leads: {
        title: "Kvalifikacija Kontakata",
        description: "AI postavlja kvalifikaciona pitanja",
      },
      answers: {
        title: "Instant Odgovori",
        description: "Odgovorite na FAQ za sekunde",
      },
    },
  },

  // CTA Scene
  cta: {
    line1: "Dodajte AI Podršku na",
    line2: "Vaš Sajt Danas",
    button: "Započnite Besplatno",
    url: "bookbot.app/chatbot",
  },
} as const;
