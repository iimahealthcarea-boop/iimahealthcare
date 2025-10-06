// src/components/SectionDivider.tsx
import { Separator } from "@/components/ui/separator";

interface SectionDividerProps {
  title?: string;
}

export function SectionDivider({ title }: SectionDividerProps) {
  return (
    <div className="relative flex items-center my-8">
      <Separator className="flex-1 bg-gray-200 dark:bg-gray-700" />
      {title && (
        <span className="px-4 text-md font-medium text-center  text-muted-foreground bg-background">
          {title}
        </span>
      )}
      <Separator className="flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
