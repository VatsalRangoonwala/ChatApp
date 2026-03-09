import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes without style conflicts.
 * @param {...string|object|array} inputs - Classes to be merged.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}