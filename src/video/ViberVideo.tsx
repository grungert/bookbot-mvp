import React from "react";
import { Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";

import { ViberHookScene } from "./viber-scenes/ViberHookScene";
import { ViberHeroScene } from "./viber-scenes/ViberHeroScene";
import { ViberDemoScene } from "./viber-scenes/ViberDemoScene";
import { ViberFeaturesScene } from "./viber-scenes/ViberFeaturesScene";
import { ViberUseCasesScene } from "./viber-scenes/ViberUseCasesScene";
import { ViberCTAScene } from "./viber-scenes/ViberCTAScene";
import { ViberBackground } from "./components/ViberBackground";
import { viberSceneTiming, ViberCompositionProps } from "./viberConstants";
import { ViberTranslationProvider } from "./viber-translations";

// Load Inter font
loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const ViberVideo: React.FC<z.infer<typeof ViberCompositionProps>> = ({
  title,
  locale = "en",
}) => {
  return (
    <ViberTranslationProvider locale={locale}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Background layer - Viber purple themed sphere animation */}
        <ViberBackground />

        {/* Content layer - scenes with their own timing */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {/* Scene 1: Hook (0-3s) - "Still missing customer Viber messages?" */}
          <Sequence
            name="1. Hook"
            from={viberSceneTiming.hook.start}
            durationInFrames={viberSceneTiming.hook.duration}
          >
            <ViberHookScene />
          </Sequence>

          {/* Scene 2: Hero (3-8s) - Main value proposition */}
          <Sequence
            name="2. Hero"
            from={viberSceneTiming.hero.start}
            durationInFrames={viberSceneTiming.hero.duration}
          >
            <ViberHeroScene />
          </Sequence>

          {/* Scene 3: Demo (8-20s) - Viber booking conversation */}
          <Sequence
            name="3. Demo"
            from={viberSceneTiming.demo.start}
            durationInFrames={viberSceneTiming.demo.duration}
          >
            <ViberDemoScene />
          </Sequence>

          {/* Scene 4: Features (20-26s) - Feature grid */}
          <Sequence
            name="4. Features"
            from={viberSceneTiming.features.start}
            durationInFrames={viberSceneTiming.features.duration}
          >
            <ViberFeaturesScene />
          </Sequence>

          {/* Scene 5: Use Cases (26-32s) - Business applications */}
          <Sequence
            name="5. Use Cases"
            from={viberSceneTiming.useCases.start}
            durationInFrames={viberSceneTiming.useCases.duration}
          >
            <ViberUseCasesScene />
          </Sequence>

          {/* Scene 6: CTA (32-36s) - Final call to action */}
          <Sequence
            name="6. CTA"
            from={viberSceneTiming.cta.start}
            durationInFrames={viberSceneTiming.cta.duration}
          >
            <ViberCTAScene />
          </Sequence>
        </div>
      </div>
    </ViberTranslationProvider>
  );
};
