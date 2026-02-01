import React from "react";
import { Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";

import { MobileHookScene } from "./mobile-scenes/MobileHookScene";
import { MobileHeroScene } from "./mobile-scenes/MobileHeroScene";
import { MobileDemoScene } from "./mobile-scenes/MobileDemoScene";
import { MobileFeaturesScene } from "./mobile-scenes/MobileFeaturesScene";
import { MobileUseCasesScene } from "./mobile-scenes/MobileUseCasesScene";
import { MobileCTAScene } from "./mobile-scenes/MobileCTAScene";
import { MobileBackground } from "./components/MobileBackground";
import { mobileSceneTiming, MobileCompositionProps } from "./mobileConstants";
import { MobileTranslationProvider } from "./mobile-translations";

// Load Inter font
loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const MobileVideo: React.FC<z.infer<typeof MobileCompositionProps>> = ({
  title,
  locale = "en",
}) => {
  return (
    <MobileTranslationProvider locale={locale}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Background layer - Blue/purple themed sphere animation */}
        <MobileBackground />

        {/* Content layer - scenes with their own timing */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {/* Scene 1: Hook (0-3s) - "Stuck at your desk managing bookings?" */}
          <Sequence
            name="1. Hook"
            from={mobileSceneTiming.hook.start}
            durationInFrames={mobileSceneTiming.hook.duration}
          >
            <MobileHookScene />
          </Sequence>

          {/* Scene 2: Hero (3-8s) - Main value proposition */}
          <Sequence
            name="2. Hero"
            from={mobileSceneTiming.hero.start}
            durationInFrames={mobileSceneTiming.hero.duration}
          >
            <MobileHeroScene />
          </Sequence>

          {/* Scene 3: Demo (8-24s) - Dashboard with notification flow */}
          <Sequence
            name="3. Demo"
            from={mobileSceneTiming.demo.start}
            durationInFrames={mobileSceneTiming.demo.duration}
          >
            <MobileDemoScene />
          </Sequence>

          {/* Scene 4: Features (24-30s) - Feature grid */}
          <Sequence
            name="4. Features"
            from={mobileSceneTiming.features.start}
            durationInFrames={mobileSceneTiming.features.duration}
          >
            <MobileFeaturesScene />
          </Sequence>

          {/* Scene 5: Use Cases (30-36s) - Business applications */}
          <Sequence
            name="5. Use Cases"
            from={mobileSceneTiming.useCases.start}
            durationInFrames={mobileSceneTiming.useCases.duration}
          >
            <MobileUseCasesScene />
          </Sequence>

          {/* Scene 6: CTA (36-40s) - Final call to action */}
          <Sequence
            name="6. CTA"
            from={mobileSceneTiming.cta.start}
            durationInFrames={mobileSceneTiming.cta.duration}
          >
            <MobileCTAScene />
          </Sequence>
        </div>
      </div>
    </MobileTranslationProvider>
  );
};
