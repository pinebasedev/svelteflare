import z from 'zod';

export const passwordResetFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .max(64, { message: 'Password must be under 64 characters.' })
      .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter.' })
      .regex(/[a-z]/, { message: 'Password must contain a lowercase letter.' })
      .regex(/[0-9]/, { message: 'Password must contain a number.' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain a special character.' }),
    confirmPassword: z.string(),
    token: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });

export type FormSchema = typeof passwordResetFormSchema;
