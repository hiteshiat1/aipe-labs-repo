import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + hint + error wrapper. Use with a native input/textarea child
 * whose `id` matches the `id` prop here.
 */
export function Field({ id, label, hint, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
        {required && (
          <span className="ml-1 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClasses = (hasError: boolean) =>
  cn(
    "block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm",
    "focus:outline-none focus:ring-1",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
      : "border-slate-300 focus:border-slate-500 focus:ring-slate-500",
  );

function describedBy(id: string, hint?: string, error?: string) {
  const parts = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  type = "text",
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        type={type}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses(!!error), className)}
        required={required}
        {...props}
      />
    </Field>
  );
}

interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

export function TextareaField({
  id,
  label,
  hint,
  error,
  required,
  rows = 4,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        aria-describedby={describedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses(!!error), "resize-y", className)}
        required={required}
        {...props}
      />
    </Field>
  );
}
