import { Router } from 'express';
import type { RequestHandler } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, extractUser } from '../../middleware/auth.js';
import { registerBodySchema, loginBodySchema } from './auth.schema.js';
import { env } from '../../config/env.js';
import rateLimit from 'express-rate-limit';

function createAuthLimiter(): RequestHandler {
  if (env.NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  });
}

const authLimiter = createAuthLimiter();

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerBodySchema }),
  authController.register,
);

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginBodySchema }),
  authController.login,
);

authRouter.post('/refresh', authController.refresh);

authRouter.post('/logout', extractUser, authController.logout);

authRouter.get('/me', requireAuth, authController.me);
