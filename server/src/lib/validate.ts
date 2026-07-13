import { z } from 'zod'
import { BadRequestError } from './errors.js'

/**
 * Validate request data against a Zod schema.
 * Throws BadRequestError with detailed field errors on failure.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    throw new BadRequestError('Validation failed', fieldErrors)
  }
  return result.data
}

// ─── Common Schemas ──────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const emailSchema = z.string().email('Invalid email format').toLowerCase().trim()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
