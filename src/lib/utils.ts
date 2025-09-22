import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Fonction pour fermer la sidebar mobile
export const closeMobileSidebar = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    // Vous pouvez stocker l'état dans un contexte ou localStorage
    localStorage.setItem('sidebarOpen', 'false');
  }
};