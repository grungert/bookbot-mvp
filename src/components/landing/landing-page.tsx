"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { PricingSection } from "./pricing-section";
import { CtaSection } from "./cta-section";

// Lazy load sphere background - covers full page
const SphereBackground = dynamic(
  () => import("./sphere-background").then((mod) => mod.SphereBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
    ),
  }
);

export function LandingPage() {
  return (
    <main className="min-h-screen relative">
      {/* Full-page sphere background - fixed position */}
      <div className="fixed inset-0 -z-10">
        <SphereBackground />
      </div>

      {/* Content */}
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CtaSection />

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BookBot. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
