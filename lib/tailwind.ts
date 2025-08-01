import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function that merges Tailwind CSS classes.
 * It handles conflicting classes properly by using tailwind-merge.
 */
export function tw(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}