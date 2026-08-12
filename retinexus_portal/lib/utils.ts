import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PHONE_REGEX = /^\d{11}$/;

export function isValidPhone(phone: string) {
  return PHONE_REGEX.test(phone);
}
