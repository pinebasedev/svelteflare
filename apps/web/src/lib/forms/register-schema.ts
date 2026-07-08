import z from 'zod';

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long.' })
      .max(50, { message: 'Name must be under 50 characters.' })
      .trim(),
    email: z.email({ message: 'Please enter a valid email address.' }).trim(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long.' })
      .max(64, { message: 'Password must be under 64 characters.' })
      .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter.' })
      .regex(/[a-z]/, { message: 'Password must contain a lowercase letter.' })
      .regex(/[0-9]/, { message: 'Password must contain a number.' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain a special character.' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword']
  });

export type FormSchema = typeof registerFormSchema;
