import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isToday, isSameYear, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isSameYear(date, new Date())) {
    return format(date, "MMM d, h:mm a");
  } else {
    return format(date, "MMM d yyyy, h:mm a");
  }
}
