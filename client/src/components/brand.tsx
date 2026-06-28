import { MessageCircleMore } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
    >
      <MessageCircleMore className="size-[60%]" strokeWidth={2.2} />
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <BrandMark className="size-8" />
      <span className="text-lg tracking-tight">Yok</span>
    </span>
  );
}
