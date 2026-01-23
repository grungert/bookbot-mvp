"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Play, LayoutDashboard } from "lucide-react";
import dynamic from "next/dynamic";
import { VideoPlaceholder } from "./video-player";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/navigation/user-menu";

// Lazy load video player
const VideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <VideoPlaceholder />,
  }
);

export function HeroSection() {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && status === "authenticated" && session?.user;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0, 0, 0.2, 1] },
    },
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="lg" showText />
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Show Dashboard button for logged in users */}
                <Link href={
                  session.user.role === "SUPER_ADMIN"
                    ? "/super-admin"
                    : session.user.role === "COMPANY_ADMIN" && session.user.memberships?.[0]?.companySlug
                      ? `/c/${session.user.memberships[0].companySlug}/admin`
                      : "/account"
                }>
                  <Button variant="ghost" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {tNav("dashboard")}
                  </Button>
                </Link>
                <UserMenu showDashboardLink={false} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="cursor-pointer">{t("login")}</Button>
                </Link>
                <Link href="/register">
                  <Button variant="gradient" className="cursor-pointer">{t("getStarted")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Headline */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("heroTitle")}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("heroSubtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              variants={itemVariants}
            >
              <Link href="/register">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 cursor-pointer">
                  {t("startFreeTrial")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 cursor-pointer"
                onClick={scrollToFeatures}
              >
                <Play className="mr-2 h-5 w-5" />
                {t("watchDemo")}
              </Button>
            </motion.div>

            {/* Video Player */}
            <motion.div
              className="max-w-3xl mx-auto"
              variants={itemVariants}
            >
              <VideoPlayer
                src="/videos/bookbot-demo.mp4"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
