"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatConfirmationButtonsProps {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  animate?: boolean;
}

export function ChatConfirmationButtons({
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  disabled = false,
}: ChatConfirmationButtonsProps) {
  const [selected, setSelected] = useState<"confirm" | "cancel" | null>(null);

  const handleConfirm = () => {
    setSelected("confirm");
    onConfirm?.();
  };

  const handleCancel = () => {
    setSelected("cancel");
    onCancel?.();
  };

  const isDisabled = disabled || selected !== null;

  return (
    <div className="mt-2 flex gap-2">
      <Button
        variant={selected === "confirm" ? "default" : "default"}
        size="sm"
        onClick={handleConfirm}
        disabled={isDisabled && selected !== "confirm"}
        className={cn(
          "text-xs h-8 px-3",
          isDisabled && selected !== "confirm" && "opacity-40",
          selected === "confirm" && "bg-primary text-primary-foreground"
        )}
      >
        {selected === "confirm" && <Check className="h-3 w-3 mr-1" />}
        {confirmLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCancel}
        disabled={isDisabled && selected !== "cancel"}
        className={cn(
          "text-xs h-8 px-3",
          isDisabled && selected !== "cancel" && "opacity-40",
          selected === "cancel" && "bg-muted"
        )}
      >
        {selected === "cancel" && <X className="h-3 w-3 mr-1" />}
        {cancelLabel}
      </Button>
    </div>
  );
}
