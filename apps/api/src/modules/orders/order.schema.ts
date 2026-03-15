import { z } from 'zod/v4';

export const orderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
