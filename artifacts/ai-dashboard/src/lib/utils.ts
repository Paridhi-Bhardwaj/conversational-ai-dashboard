import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return String(num);
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    notation: n > 10000 ? "compact" : "standard",
    compactDisplay: "short"
  }).format(n);
}
