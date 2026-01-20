"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { FeaturesSection } from "./features-section";
import { UseCasesSection } from "./use-cases-section";
import { PricingSection } from "./pricing-section";
import { FAQSection } from "./faq-section";
import { CtaSection } from "./cta-section";

// Lazy load sphere background - covers full page
const SphereBackground = dynamic(
  () => import("./sphere-background").then((mod) => mod.SphereBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent" />
    ),
  }
);

// Scrolling grid background
function ScrollingGrid() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* White/Gray Grid - base layer */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />
      {/* Blue Grid with glow - starts from top-left, fades toward bottom-right */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          filter: "drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))"
        }}
      />
      {/* Blue Gradient Glow - ambient light from top-left */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)
          `
        }}
      />
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen relative">
      {/* Full-page sphere background - fixed position */}
      <div className="fixed inset-0 -z-10">
        <SphereBackground />
      </div>

      {/* Scrolling grid overlay */}
      <ScrollingGrid />

      {/* Content */}
      <div className="relative z-10">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <PricingSection />
        <FAQSection />
        <CtaSection />
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BookBot. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
