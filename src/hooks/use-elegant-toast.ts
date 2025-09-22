'use client';

import { useToast } from '@/components/ui/use-toast';

export function useElegantToast() {
  const { toast } = useToast();

  const showToast = {
    // Message de succès
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'success',
        duration: 3000,
      });
    },

    // Message d'erreur
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
        duration: 4000,
      });
    },

    // Message d'avertissement
    warning: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'warning',
        duration: 3500,
      });
    },

    // Message d'information
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'info',
        duration: 3000,
      });
    },

    // Message personnalisé
    custom: (props: {
      title: string;
      description?: string;
      variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info';
      duration?: number;
    }) => {
      toast({
        ...props,
        duration: props.duration || 3000,
      });
    }
  };

  return showToast;
}