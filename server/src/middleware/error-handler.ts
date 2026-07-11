import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Known application errors
  if (error instanceof AppError) {
    logger.warn({
      err: error,
      method: request.method,
      url: request.url,
      statusCode: error.statusCode,
    })
    return reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })
  }

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.validation,
      },
    })
  }

  // Rate limit errors
  if ('statusCode' in error && (error as FastifyError).statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    })
  }

  // Prisma unique constraint violations
  if (error.message?.includes('Unique constraint')) {
    return reply.status(409).send({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists',
      },
    })
  }

  // Unknown errors — log full stack, return generic message
  logger.error({
    err: error,
    method: request.method,
    url: request.url,
    stack: error.stack,
  })

  return reply.status(500).send({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  })
}
