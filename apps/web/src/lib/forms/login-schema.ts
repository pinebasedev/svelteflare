import z from 'zod';

export const loginFormSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address.' }).trim(),
  password: z.string()
});

export type FormSchema = typeof loginFormSchema;
