"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatService } from "../types";
import { PromotionalBadge } from "@/components/service/promotional-badge";
import { isDiscountActive, calculateDiscountedPrice } from "@/lib/utils/discount";

interface ChatServiceSelectorProps {
  services: ChatService[];
  onSelect?: (service: ChatService) => void;
  disabled?: boolean;
  preSelectedServiceName?: string; // Pre-selected service name for historical messages
}

// Helper to find service ID by name
function findServiceIdByName(
  services: ChatService[],
  serviceName: string
): string | null {
  const normalizedName = serviceName.toLowerCase().trim();
  for (const service of services) {
    if (service.name.toLowerCase().trim() === normalizedName) {
      return service.id;
    }
  }
  return null;
}

export function ChatServiceSelector({
  services,
  onSelect,
  disabled = false,
  preSelectedServiceName,
}: ChatServiceSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (disabled && preSelectedServiceName) {
      return findServiceIdByName(services, preSelectedServiceName);
    }
    return null;
  });

  const handleSelect = (service: ChatService) => {
    setSelectedId(service.id);
    onSelect?.(service);
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full max-w-[280px]">
      {services.map((service) => {
        const isSelected = selectedId === service.id;
        const hasDiscount = isDiscountActive(service);

        // Calculate discount if applicable
        const priceResult = hasDiscount ? calculateDiscountedPrice(service) : null;

        return (
          <button
            key={service.id}
            onClick={() => handleSelect(service)}
            disabled={disabled}
            className={cn(
              "w-full p-3 border rounded-lg text-left transition-all duration-200",
              "bg-background hover:bg-muted/50 hover:border-primary",
              isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20",
              disabled && !isSelected && "opacity-40 cursor-default hover:bg-background hover:border-border",
              disabled && isSelected && "opacity-100 cursor-default"
            )}
          >
            <div className="flex gap-2">
              <div
                className="w-1 rounded-full shrink-0 self-stretch"
                style={{ backgroundColor: service.color || "#3B82F6" }}
              />
              <div className="flex-1 min-w-0">
                {/* Service name with badge inline */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <h4 className="font-medium text-sm">{service.name}</h4>
                  {(service.promotionalBadge || service.customBadgeLabel) && (
                    <PromotionalBadge
                      badge={service.promotionalBadge}
                      customLabel={service.customBadgeLabel}
                      size="sm"
                    />
                  )}
                </div>

                {/* Compact price display - single line */}
                <div className="flex items-center gap-1.5 mt-1">
                  {hasDiscount && priceResult ? (
                    <>
                      <span className="text-xs text-muted-foreground line-through">
                        {priceResult.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-sm font-medium text-emerald-600">
                        {service.currency} {Math.round(priceResult.finalPrice).toLocaleString()}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1 py-0.5 rounded text-white"
                        style={{ backgroundColor: service.color || "#3B82F6" }}
                      >
                        -{priceResult.discountPercentage}%
                      </span>
                    </>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: service.color ? `${service.color}20` : undefined,
                        color: service.color || undefined,
                        borderColor: service.color ? `${service.color}40` : undefined,
                      }}
                    >
                      {service.currency} {Number(service.price).toLocaleString()}
                    </Badge>
                  )}
                </div>

                {service.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{service.duration} min</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
