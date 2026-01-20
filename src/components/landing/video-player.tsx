"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, X, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded]);

  // Prevent body scroll when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  // Update progress bar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, []);

  const showControls = !isPlaying || isHovering;

  return (
    <>
      {/* Normal view */}
      <motion.div
        className={cn(
          "relative rounded-2xl overflow-hidden shadow-2xl aspect-video",
          "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md",
          "border border-white/30 dark:border-white/20",
          "p-0.5",
          className
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        layoutId="video-container"
      >
        <div className="relative w-full h-full rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            onEnded={handleEnded}
            onClick={togglePlay}
            className={cn(
              "w-full h-full object-cover cursor-pointer transition-opacity duration-500",
              isPlaying ? "opacity-100" : "opacity-70"
            )}
            playsInline
            preload="metadata"
          />

          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300",
              isPlaying && !isHovering ? "opacity-0 pointer-events-none" : "opacity-100",
              !isPlaying && "bg-black/10"
            )}
          >
            <Button
              onClick={togglePlay}
              size="lg"
              className={cn(
                "rounded-full w-20 h-20 p-0 transition-all duration-300 cursor-pointer",
                "bg-white/90 hover:bg-white text-black shadow-xl hover:scale-110",
                isPlaying && !isHovering && "opacity-0 scale-90"
              )}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Expand button */}
          <motion.div
            className={cn(
              "absolute top-3 right-3",
              showControls ? "pointer-events-auto" : "pointer-events-none"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: showControls ? 1 : 0,
              scale: showControls ? 1 : 0.8
            }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={toggleExpanded}
              size="sm"
              className="rounded-lg bg-black/50 hover:bg-black/70 text-white cursor-pointer"
              aria-label="Expand video"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* Progress bar */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 bg-black/20 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleExpanded}
          >
            <motion.div
              className="relative w-full max-w-7xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/30 dark:border-white/20 p-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <video
                  src={src}
                  poster={poster}
                  onClick={togglePlay}
                  autoPlay={isPlaying}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleEnded}
                  className="w-full h-full object-cover cursor-pointer"
                  playsInline
                />

              {/* Close button */}
              <motion.div
                className="absolute top-4 right-4 z-20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded();
                  }}
                  size="sm"
                  className="rounded-full bg-white/90 hover:bg-white text-black cursor-pointer shadow-lg"
                  aria-label="Close expanded view"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>

              {/* Play/Pause overlay for expanded */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all duration-300 z-10",
                  isPlaying && !isHovering ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-none"
                )}
              >
                <Button
                  onClick={togglePlay}
                  size="lg"
                  className={cn(
                    "rounded-full w-24 h-24 p-0 transition-all duration-300 cursor-pointer pointer-events-auto",
                    "bg-white/90 hover:bg-white text-black shadow-xl hover:scale-110",
                    isPlaying && !isHovering && "opacity-0 scale-90"
                  )}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? (
                    <Pause className="h-10 w-10" />
                  ) : (
                    <Play className="h-10 w-10 ml-1" />
                  )}
                </Button>
              </div>

              {/* Progress bar for expanded */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Placeholder component when video is not available
export function VideoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center",
        "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md",
        "border border-white/30 dark:border-white/20",
        "p-0.5",
        className
      )}
    >
      <div className="text-center p-8">
        <div className="w-20 h-20 rounded-full bg-white/40 dark:bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <Play className="h-10 w-10 text-muted-foreground ml-1" />
        </div>
        <p className="text-muted-foreground">Demo video coming soon</p>
      </div>
    </div>
  );
}
