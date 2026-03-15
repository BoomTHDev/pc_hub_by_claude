import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, extractUser } from '../../middleware/auth.js';
import { registerBodySchema, loginBodySchema } from './auth.schema.js';
import { createRateLimiter } from '../../config/rate-limit.js';

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many attempts, please try again later',
});

const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many refresh attempts, please try again later',
});

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

authRouter.post('/refresh', refreshLimiter, authController.refresh);

authRouter.post('/logout', extractUser, authController.logout);

authRouter.get('/me', requireAuth, authController.me);
