import z from 'zod';

export const requestPasswordResetFormSchema = z.object({
  email: z.email({ message: 'Please enter a valid email address.' }).trim()
});

export type FormSchema = typeof requestPasswordResetFormSchema;
