import React from "react";
import { Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";

import { ChatbotHookScene } from "./chatbot-scenes/ChatbotHookScene";
import { ChatbotHeroScene } from "./chatbot-scenes/ChatbotHeroScene";
import { InstallDemoScene } from "./chatbot-scenes/InstallDemoScene";
import { LiveChatDemoScene } from "./chatbot-scenes/LiveChatDemoScene";
import { ChatbotFeaturesScene } from "./chatbot-scenes/ChatbotFeaturesScene";
import { ChatbotUseCasesScene } from "./chatbot-scenes/ChatbotUseCasesScene";
import { ChatbotCTAScene } from "./chatbot-scenes/ChatbotCTAScene";
import { ThreeBackground } from "./components/ThreeBackground";
import { chatbotSceneTiming, ChatbotCompositionProps } from "./chatbotConstants";
import { ChatbotTranslationProvider } from "./chatbot-translations";

// Load Inter font
loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700", "800"],
});

export const ChatbotVideo: React.FC<z.infer<typeof ChatbotCompositionProps>> = ({
  title,
  locale = "en",
}) => {
  return (
    <ChatbotTranslationProvider locale={locale}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Background layer - runs for entire video */}
        <ThreeBackground />

        {/* Content layer - scenes with their own timing */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {/* Scene 1: Hook (0-3s) - "Still answering the same questions?" */}
          <Sequence
            name="1. Hook"
            from={chatbotSceneTiming.hook.start}
            durationInFrames={chatbotSceneTiming.hook.duration}
          >
            <ChatbotHookScene />
          </Sequence>

          {/* Scene 2: Hero (3-8s) - Main value proposition */}
          <Sequence
            name="2. Hero"
            from={chatbotSceneTiming.hero.start}
            durationInFrames={chatbotSceneTiming.hero.duration}
          >
            <ChatbotHeroScene />
          </Sequence>

          {/* Scene 3: Installation Demo (8-14s) - One line of code */}
          <Sequence
            name="3. Install Demo"
            from={chatbotSceneTiming.installDemo.start}
            durationInFrames={chatbotSceneTiming.installDemo.duration}
          >
            <InstallDemoScene />
          </Sequence>

          {/* Scene 4: Live Chat Demo (14-24s) - Booking conversation */}
          <Sequence
            name="4. Live Chat Demo"
            from={chatbotSceneTiming.liveChatDemo.start}
            durationInFrames={chatbotSceneTiming.liveChatDemo.duration}
          >
            <LiveChatDemoScene />
          </Sequence>

          {/* Scene 5: Features (24-32s) - Feature grid */}
          <Sequence
            name="5. Features"
            from={chatbotSceneTiming.features.start}
            durationInFrames={chatbotSceneTiming.features.duration}
          >
            <ChatbotFeaturesScene />
          </Sequence>

          {/* Scene 6: Use Cases (32-38s) - Business applications */}
          <Sequence
            name="6. Use Cases"
            from={chatbotSceneTiming.useCases.start}
            durationInFrames={chatbotSceneTiming.useCases.duration}
          >
            <ChatbotUseCasesScene />
          </Sequence>

          {/* Scene 7: CTA (38-45s) - Final call to action */}
          <Sequence
            name="7. CTA"
            from={chatbotSceneTiming.cta.start}
            durationInFrames={chatbotSceneTiming.cta.duration}
          >
            <ChatbotCTAScene />
          </Sequence>
        </div>
      </div>
    </ChatbotTranslationProvider>
  );
};
