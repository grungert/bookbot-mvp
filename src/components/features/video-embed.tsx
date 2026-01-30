"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoEmbedProps {
  videoId: string;
  platform?: "youtube" | "vimeo";
  title?: string;
  thumbnail?: string;
  className?: string;
}

export function VideoEmbed({
  videoId,
  platform = "youtube",
  title = "Video",
  thumbnail,
  className,
}: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const embedUrl =
    platform === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`;

  const thumbnailUrl =
    thumbnail ||
    (platform === "youtube"
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : undefined);

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-2xl aspect-video",
        "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md",
        "border border-white/30 dark:border-white/20",
        className
      )}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
    >
      {isLoaded ? (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          onClick={() => setIsLoaded(true)}
          className="absolute inset-0 w-full h-full flex items-center justify-center group cursor-pointer"
          aria-label={`Play ${title}`}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
          <motion.div
            className="relative z-10 w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
            whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Play className="h-8 w-8 text-black ml-1" />
          </motion.div>
        </button>
      )}
    </motion.div>
  );
}

interface VideoPlaceholderProps {
  className?: string;
  message?: string;
}

export function VideoPlaceholder({
  className,
  message = "Demo video coming soon",
}: VideoPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center",
        "backdrop-blur-md",
        "border border-white/30 dark:border-white/20",
        className
      )}
      style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.15) 50%, rgba(236, 72, 153, 0.1) 100%)",
        boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.15), 0 20px 40px -15px rgba(168, 85, 247, 0.1)",
      }}
    >
      <div className="text-center p-8">
        <div
          className="w-20 h-20 rounded-full backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)",
          }}
        >
          <Play className="h-10 w-10 text-blue-500 ml-1" />
        </div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
