"use client";

import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  contentKey: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  primaryColor?: string | null;
}

export function HelpTooltip({
  contentKey,
  className,
  side = "top",
  primaryColor,
}: HelpTooltipProps) {
  const t = useTranslations();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
              className
            )}
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs"
          style={
            primaryColor
              ? { backgroundColor: primaryColor, color: "white" }
              : undefined
          }
        >
          {t(contentKey)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
