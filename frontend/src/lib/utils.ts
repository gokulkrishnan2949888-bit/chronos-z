import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// User requested spring animation configuration: stiffness: 300, damping: 30
export const cyberSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const cyberSpringBouncy = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 25,
};

export const cyberSpringGentle = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
};

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
