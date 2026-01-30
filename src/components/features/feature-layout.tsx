"use client";

import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/logo";
import { MainNav } from "@/components/navigation/main-nav";

// Lazy load sphere background
const SphereBackground = dynamic(
  () => import("@/components/landing/sphere-background").then((mod) => mod.SphereBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/10 via-violet-400/5 to-transparent" />
    ),
  }
);

// Scrolling grid background (same as landing page)
function ScrollingGrid() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none">
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

// Footer component
function FeatureFooter() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-6">
          <Logo size="xxl" showText />
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} BookBot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

interface FeatureLayoutProps {
  children: React.ReactNode;
}

export function FeatureLayout({ children }: FeatureLayoutProps) {
  return (
    <main className="min-h-screen relative">
      {/* Full-page sphere background - fixed position */}
      <div className="fixed inset-0 -z-10">
        <SphereBackground />
      </div>

      {/* Scrolling grid overlay */}
      <ScrollingGrid />

      {/* Header */}
      <MainNav />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Footer */}
      <FeatureFooter />
    </main>
  );
}
