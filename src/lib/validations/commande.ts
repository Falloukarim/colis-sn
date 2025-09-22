import { z } from 'zod';

export const commandeSchema = z.object({
  client_id: z.string()
    .uuid('ID client invalide')
    .min(1, 'Client requis'),
  statut: z.enum(['en_cours', 'disponible', 'remis'])
    .refine(val => !!val, { message: 'Statut requis' }),
  poids: z.number()
    .optional()
    .refine(val => !val || val > 0, {
      message: 'Le poids doit être supérieur à 0'
    })
    .refine(val => !val || val <= 1000, {
      message: 'Le poids ne peut pas dépasser 1000 kg'
    }),
  prix_kg: z.number()
    .optional()
    .refine(val => !val || val >= 0, {
      message: 'Le prix au kg ne peut pas être négatif'
    })
    .refine(val => !val || val <= 1000, {
      message: 'Le prix au kg ne peut pas dépasser 1000 xof'
    })
});

export const commandeCreateSchema = commandeSchema.pick({
  client_id: true
});

export const commandeUpdateSchema = commandeSchema.extend({
  id: z.string().uuid('ID commande invalide')
}).partial();

export const commandeStatusSchema = z.object({
  statut: z.enum(['en_cours', 'disponible', 'remis'])
    .refine(val => !!val, { message: 'Statut requis' }),
  poids: z.number()
    .optional()
    .refine(val => !val || val > 0, {
      message: 'Le poids doit être supérieur à 0'
    }),
  prix_kg: z.number()
    .optional()
    .refine(val => !val || val >= 0, {
      message: 'Le prix au kg ne peut pas être négatif'
    })
});
