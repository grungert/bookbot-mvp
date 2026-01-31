import React from "react";
import { Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";

import { WhatsAppHookScene } from "./whatsapp-scenes/WhatsAppHookScene";
import { WhatsAppHeroScene } from "./whatsapp-scenes/WhatsAppHeroScene";
import { WhatsAppDemoScene } from "./whatsapp-scenes/WhatsAppDemoScene";
import { WhatsAppFeaturesScene } from "./whatsapp-scenes/WhatsAppFeaturesScene";
import { WhatsAppUseCasesScene } from "./whatsapp-scenes/WhatsAppUseCasesScene";
import { WhatsAppCTAScene } from "./whatsapp-scenes/WhatsAppCTAScene";
import { WhatsAppBackground } from "./components/WhatsAppBackground";
import { whatsappSceneTiming, WhatsAppCompositionProps } from "./whatsappConstants";
import { WhatsAppTranslationProvider } from "./whatsapp-translations";

// Load Inter font
loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const WhatsAppVideo: React.FC<z.infer<typeof WhatsAppCompositionProps>> = ({
  title,
  locale = "en",
}) => {
  return (
    <WhatsAppTranslationProvider locale={locale}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Background layer - runs for entire video (WhatsApp green theme) */}
        <WhatsAppBackground />

        {/* Content layer - scenes with their own timing */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {/* Scene 1: Hook (0-3s) - "Still missing customer WhatsApp messages?" */}
          <Sequence
            name="1. Hook"
            from={whatsappSceneTiming.hook.start}
            durationInFrames={whatsappSceneTiming.hook.duration}
          >
            <WhatsAppHookScene />
          </Sequence>

          {/* Scene 2: Hero (3-8s) - Main value proposition */}
          <Sequence
            name="2. Hero"
            from={whatsappSceneTiming.hero.start}
            durationInFrames={whatsappSceneTiming.hero.duration}
          >
            <WhatsAppHeroScene />
          </Sequence>

          {/* Scene 3: Demo (8-20s) - WhatsApp booking conversation */}
          <Sequence
            name="3. Demo"
            from={whatsappSceneTiming.demo.start}
            durationInFrames={whatsappSceneTiming.demo.duration}
          >
            <WhatsAppDemoScene />
          </Sequence>

          {/* Scene 4: Features (20-26s) - Feature grid */}
          <Sequence
            name="4. Features"
            from={whatsappSceneTiming.features.start}
            durationInFrames={whatsappSceneTiming.features.duration}
          >
            <WhatsAppFeaturesScene />
          </Sequence>

          {/* Scene 5: Use Cases (26-32s) - Business applications */}
          <Sequence
            name="5. Use Cases"
            from={whatsappSceneTiming.useCases.start}
            durationInFrames={whatsappSceneTiming.useCases.duration}
          >
            <WhatsAppUseCasesScene />
          </Sequence>

          {/* Scene 6: CTA (32-45s) - Final call to action */}
          <Sequence
            name="6. CTA"
            from={whatsappSceneTiming.cta.start}
            durationInFrames={whatsappSceneTiming.cta.duration}
          >
            <WhatsAppCTAScene />
          </Sequence>
        </div>
      </div>
    </WhatsAppTranslationProvider>
  );
};
