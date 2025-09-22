import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  password: z.string()
    .min(1, 'Mot de passe requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

export const registerSchema = z.object({
  organizationName: z.string()
    .min(1, 'Nom de l\'organisation requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  subdomain: z.string()
    .min(1, 'Sous-domaine requis')
    .min(3, 'Le sous-domaine doit contenir au moins 3 caractères')
    .max(20, 'Le sous-domaine ne peut pas dépasser 20 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le sous-domaine ne peut contenir que des lettres minuscules, chiffres et tirets'),
  email: z.string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  password: z.string()
    .min(1, 'Mot de passe requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
});

export const resetPasswordSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .min(1, 'Email requis')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(1, 'Nouveau mot de passe requis')
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;