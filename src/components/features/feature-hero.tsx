"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { VideoEmbed, VideoPlaceholder } from "./video-embed";
import type { LucideIcon } from "lucide-react";

interface FeatureHeroProps {
  icon: LucideIcon;
  badge?: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref?: string;
  secondaryCta?: {
    text: string;
    href: string;
  };
  videoId?: string;
  videoPlatform?: "youtube" | "vimeo";
  videoThumbnail?: string;
}

export function FeatureHero({
  icon: Icon,
  badge,
  headline,
  subheadline,
  ctaText,
  ctaHref = "/register",
  secondaryCta,
  videoId,
  videoPlatform = "youtube",
  videoThumbnail,
}: FeatureHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
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

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Back to features link */}
        <motion.div
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="mb-8"
        >
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to pricing</span>
          </Link>
        </motion.div>

        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Icon and Badge */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-6">
            <div
              className="p-3 rounded-2xl backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
              }}
            >
              <Icon className="h-8 w-8 text-blue-500" />
            </div>
            {badge && (
              <span
                className="px-3 py-1 rounded-full text-sm font-medium border"
                style={{
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                {badge}
              </span>
            )}
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
            }}
            variants={itemVariants}
          >
            {headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto"
            style={{
              textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px",
            }}
            variants={itemVariants}
          >
            {subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            variants={itemVariants}
          >
            <Link href={ctaHref}>
              <Button variant="gradient" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 cursor-pointer">
                {ctaText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 cursor-pointer">
                  {secondaryCta.text}
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Video */}
          <motion.div className="max-w-3xl mx-auto" variants={itemVariants}>
            {videoId ? (
              <VideoEmbed
                videoId={videoId}
                platform={videoPlatform}
                title={headline}
                thumbnail={videoThumbnail}
              />
            ) : (
              <VideoPlaceholder />
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
