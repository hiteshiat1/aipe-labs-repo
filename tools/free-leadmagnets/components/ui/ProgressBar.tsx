import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0..100
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const rounded = Math.round(clamped);
  // Compose an explicit accessible label so screen readers announce
  // e.g. "Problem severity: 80 percent" rather than "80" out of context.
  const accessibleLabel = label
    ? `${label}: ${rounded} percent`
    : `${rounded} percent`;
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded bg-slate-200",
        className,
      )}
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={accessibleLabel}
    >
      <div
        className="h-full bg-slate-900"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
