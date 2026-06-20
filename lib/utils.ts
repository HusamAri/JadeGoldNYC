import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind sınıflarını çakışmadan birleştirir (shadcn standardı). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
