import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  isStarred: boolean;
  onToggle: () => Promise<void>;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StarButton: React.FC<StarButtonProps> = ({
  isStarred,
  onToggle,
  disabled = false,
  size = "md",
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onToggle();
    } catch (error) {
      console.error("Error toggling star:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "transition-all duration-200 hover:scale-110",
        sizeClasses[size],
        isStarred
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-muted-foreground hover:text-yellow-500",
        className
      )}
    >
      <Star
        className={cn(
          iconSizes[size],
          isStarred ? "fill-current" : "",
          isLoading ? "animate-pulse" : ""
        )}
      />
    </Button>
  );
};
