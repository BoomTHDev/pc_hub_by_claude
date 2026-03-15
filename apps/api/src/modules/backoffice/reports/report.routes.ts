import { Router } from 'express';
import { requireRole } from '../../../middleware/role.js';
import { createRateLimiter } from '../../../config/rate-limit.js';
import * as reportController from './report.controller.js';

const exportLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many export requests, please try again later',
});

export const reportRouter = Router();

reportRouter.use(requireRole('STAFF', 'ADMIN'));

reportRouter.get('/daily-sales', reportController.getDailySales);
reportRouter.get('/daily-sales/excel', exportLimiter, reportController.exportDailySalesExcel);
reportRouter.get('/daily-sales/pdf', exportLimiter, reportController.exportDailySalesPdf);
