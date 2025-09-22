import { z } from 'zod';

export const clientSchema = z.object({
  nom: z.string()
    .min(1, 'Nom requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-Z\s\u00C0-\u00FF]+$/, 'Le nom ne peut contenir que des lettres et espaces'),
  telephone: z.string()
    .min(1, 'Téléphone requis')
    .min(10, 'Le téléphone doit contenir au moins 10 chiffres')
    .max(15, 'Le téléphone ne peut pas dépasser 15 chiffres')
    .regex(/^(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/, 'Format de téléphone invalide'),
  whatsapp: z.string()
    .optional()
    .or(z.literal(''))
    .refine(val => !val || val.length >= 10, {
      message: 'Le WhatsApp doit contenir au moins 10 chiffres'
    })
    .refine(val => !val || val.length <= 15, {
      message: 'Le WhatsApp ne peut pas dépasser 15 chiffres'
    })
    .refine(val => !val || /^(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/.test(val), {
      message: 'Format de WhatsApp invalide'
    }),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal(''))
    .refine(val => !val || val.length <= 100, {
      message: 'L\'email ne peut pas dépasser 100 caractères'
    })
});

export const clientUpdateSchema = clientSchema.extend({
  id: z.string().uuid('ID client invalide')
});

export type ClientFormData = z.infer<typeof clientSchema>;
export type ClientUpdateFormData = z.infer<typeof clientUpdateSchema>;

export function validateClientData(data: unknown): { success: boolean; errors?: string[] } {
  const result = clientSchema.safeParse(data);

  if (!result.success) {
    const formatted = result.error.format();
    const errors = Object.values(formatted).flatMap(val =>
      // @ts-ignore
      val._errors || []
    );
    return { success: false, errors };
  }

  // Retour quand tout est valide
  return { success: true };
}


export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/;
  return phoneRegex.test(phone);
}

export function formatPhoneNumber(phone: string): string {
  // Nettoyer le numéro de téléphone
  const cleaned = phone.replace(/\D/g, '');
  
  // Formater selon la longueur
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  } else if (cleaned.length > 10) {
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(cleaned.length - 10).replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}`;
  }
  
  return phone;
}