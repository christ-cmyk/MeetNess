// Validation des formulaires pour MeedNess - React Native
// Source: src/lib/validations/auth.ts (copié tel quel)

import { z } from 'zod';

// Messages d'erreur en français
const messages = {
  required: 'Ce champ est requis',
  email: 'Adresse email invalide',
  minLength: (n: number) => `Minimum ${n} caractères`,
  maxLength: (n: number) => `Maximum ${n} caractères`,
  passwordMatch: 'Les mots de passe ne correspondent pas',
  phone: 'Numéro de téléphone invalide',
  passwordStrength: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre',
};

// Schéma de connexion
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, messages.required)
    .email(messages.email)
    .max(255, messages.maxLength(255)),
  password: z
    .string()
    .min(1, messages.required)
    .max(128, messages.maxLength(128)),
});

// Schéma d'inscription
export const registerSchema = z.object({
  username: z
    .string()
    .min(1, messages.required)
    .min(3, messages.minLength(3))
    .max(50, messages.maxLength(50))
    .regex(/^[a-zA-Z0-9]+$/, 'Seuls les lettres, chiffres et underscores sont autorisés'),
  email: z
    .string()
    .min(1, messages.required)
    .email(messages.email)
    .max(255, messages.maxLength(255)),
  phone: z
    .string()
    .min(1, messages.required)
    .regex(/^\+?[0-9]{8,15}$/, messages.phone),
  country: z
    .string()
    .min(1, messages.required),
  password: z
    .string()
    .min(1, messages.required)
    .min(8, messages.minLength(8))
    .max(128, messages.maxLength(128))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      messages.passwordStrength
    ),
  confirmPassword: z
    .string()
    .min(1, messages.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: messages.passwordMatch,
  path: ['confirmPassword'],
});

// Schéma mot de passe oublié
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, messages.required)
    .email(messages.email)
    .max(255, messages.maxLength(255)),
});

// Schéma réinitialisation mot de passe
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, messages.required)
    .min(8, messages.minLength(8))
    .max(128, messages.maxLength(128))
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      messages.passwordStrength
    ),
  confirmPassword: z
    .string()
    .min(1, messages.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: messages.passwordMatch,
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
