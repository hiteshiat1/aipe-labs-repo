import { cn } from "@/lib/utils";

interface RadioScaleProps {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  required?: boolean;
}

/**
 * Presentational 1–5 (configurable) radio group.
 * Controlled by the parent — no internal state.
 * Native radios keep keyboard navigation (arrow keys) working out of the box.
 */
export function RadioScale({
  name,
  legend,
  hint,
  error,
  value,
  onChange,
  min = 1,
  max = 5,
  minLabel = "Low",
  maxLabel = "High",
  required = false,
}: RadioScaleProps) {
  const steps: number[] = [];
  for (let i = min; i <= max; i++) steps.push(i);

  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-sm font-medium text-slate-900">
        {legend}
        {required && (
          <span className="ml-1 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        {steps.map((step) => {
          const id = `${name}-${step}`;
          const checked = value === step;
          return (
            <label
              key={step}
              htmlFor={id}
              className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition",
                "sm:h-11 sm:w-11",
                "focus-within:ring-2 focus-within:ring-slate-500 focus-within:ring-offset-2",
                checked
                  ? "border-slate-900 bg-slate-900 text-white"
                  : error
                    ? "border-rose-400 bg-white text-slate-700 hover:border-rose-500"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={step}
                checked={checked}
                onChange={() => onChange(step)}
                className="sr-only"
                required={required}
              />
              <span aria-hidden="true">{step}</span>
              <span className="sr-only">
                {step} out of {max}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>1 · {minLabel}</span>
        <span>
          {max} · {maxLabel}
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-rose-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
