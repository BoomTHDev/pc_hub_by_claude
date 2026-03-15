import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/role.js';
import { imageUpload } from '../../config/upload.js';
import { createRateLimiter } from '../../config/rate-limit.js';
import * as orderController from './order.controller.js';

const slipUploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many upload attempts, please try again later',
});

export const orderRouter = Router();

orderRouter.use(requireAuth, requireRole('CUSTOMER'));

orderRouter.get('/', orderController.listMyOrders);
orderRouter.get('/:orderId', orderController.getMyOrder);
orderRouter.get('/:orderId/payment', orderController.getMyPayment);
orderRouter.get('/:orderId/promptpay', orderController.getPromptPayQR);
orderRouter.post(
  '/:orderId/payment-slip',
  slipUploadLimiter,
  imageUpload.single('slip'),
  orderController.uploadPaymentSlip,
);
