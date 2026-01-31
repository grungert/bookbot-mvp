import React from "react";
import { Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";

import { HookScene } from "./scenes/HookScene";
import { HeroScene } from "./scenes/HeroScene";
import { ChannelsScene } from "./scenes/ChannelsScene";
import { ChatDemoScene } from "./scenes/ChatDemoScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { UseCasesScene } from "./scenes/UseCasesScene";
import { CTAScene } from "./scenes/CTAScene";
import { ThreeBackground } from "./components/ThreeBackground";
import { sceneTiming } from "./styles/theme";
import { BookBotCompositionProps } from "./constants";
import { TranslationProvider } from "./translations";

// Load Inter font
loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const BookBotVideo: React.FC<z.infer<typeof BookBotCompositionProps>> = ({
  title,
  locale = "en",
}) => {
  return (
    <TranslationProvider locale={locale}>
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Background layer - runs for entire video, uses sceneTiming internally */}
      <ThreeBackground />

      {/* Content layer - scenes with their own timing */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        {/* Scene 1: Hook (0-4s) - "Still managing bookings manually?" */}
        <Sequence
          name="1. Hook"
          from={sceneTiming.hook.start}
          durationInFrames={sceneTiming.hook.duration}
        >
          <HookScene />
        </Sequence>

        {/* Scene 2: Hero (4-9s) - Main value proposition with 3D spheres */}
        <Sequence
          name="2. Hero"
          from={sceneTiming.hero.start}
          durationInFrames={sceneTiming.hero.duration}
        >
          <HeroScene />
        </Sequence>

        {/* Scene 3: Channels (9-17s) - Multi-channel support showcase */}
        <Sequence
          name="3. Channels"
          from={sceneTiming.channels.start}
          durationInFrames={sceneTiming.channels.duration}
        >
          <ChannelsScene />
        </Sequence>

        {/* Scene 4: AI Chat Demo (17-27s) - Chat widget demonstration */}
        <Sequence
          name="4. AI Chat Demo"
          from={sceneTiming.chatDemo.start}
          durationInFrames={sceneTiming.chatDemo.duration}
        >
          <ChatDemoScene />
        </Sequence>

        {/* Scene 5: Dashboard (27-37s) - Analytics and stats */}
        <Sequence
          name="5. Dashboard"
          from={sceneTiming.dashboard.start}
          durationInFrames={sceneTiming.dashboard.duration}
        >
          <DashboardScene />
        </Sequence>

        {/* Scene 6: Features (37-47s) - Feature grid */}
        <Sequence
          name="6. Features"
          from={sceneTiming.features.start}
          durationInFrames={sceneTiming.features.duration}
        >
          <FeaturesScene />
        </Sequence>

        {/* Scene 7: Use Cases (47-52s) - Industry showcase */}
        <Sequence
          name="7. Use Cases"
          from={sceneTiming.useCases.start}
          durationInFrames={sceneTiming.useCases.duration}
        >
          <UseCasesScene />
        </Sequence>

        {/* Scene 8: CTA (52-60s) - Final call to action */}
        <Sequence
          name="8. CTA"
          from={sceneTiming.cta.start}
          durationInFrames={sceneTiming.cta.duration}
        >
          <CTAScene />
        </Sequence>
      </div>
    </div>
    </TranslationProvider>
  );
};
