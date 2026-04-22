import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toInputDate(date: Date | null | undefined): string {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split("T")[0];
}
