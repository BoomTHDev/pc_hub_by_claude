import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod/v4';
import { sendError } from '../common/response.js';

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        sendError({
          res,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        sendError({
          res,
          message: 'Invalid parameters',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        sendError({
          res,
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }
    }

    next();
  };
}
