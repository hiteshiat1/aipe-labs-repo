type ClassValue = string | number | false | null | undefined;

/**
 * Join truthy class name values with spaces.
 * Intentionally minimal — no library, no conflict resolution.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
