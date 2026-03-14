import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message;

  res.status(500).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
  });
}
