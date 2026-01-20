"use client";

import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setHasStarted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-2xl aspect-video",
        "bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm",
        "border border-white/20 dark:border-white/10",
        "p-1",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onEnded={handleEnded}
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"
      />

      {/* Overlay with play button */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100",
          "bg-black/20"
        )}
      >
        <Button
          onClick={togglePlay}
          size="lg"
          className={cn(
            "rounded-full w-16 h-16 p-0 transition-transform hover:scale-110",
            "bg-white/90 hover:bg-white text-black shadow-xl"
          )}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>
      </div>

      {/* Progress bar (only shows after video starts) */}
      {hasStarted && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{
              width: `${
                videoRef.current
                  ? (videoRef.current.currentTime / videoRef.current.duration) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Placeholder component when video is not available
export function VideoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center",
        "bg-white/40 dark:bg-gray-900/40 backdrop-blur-md",
        "border border-white/20 dark:border-white/10",
        className
      )}
    >
      <div className="text-center p-8">
        <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Demo video coming soon</p>
      </div>
    </div>
  );
}
