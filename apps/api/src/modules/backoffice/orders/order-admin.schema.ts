import { z } from 'zod/v4';

export const backofficeOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type BackofficeOrderListQuery = z.infer<typeof backofficeOrderListQuerySchema>;

export const orderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export const rejectBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export type RejectBody = z.infer<typeof rejectBodySchema>;

export const advanceStatusBodySchema = z.object({
  status: z.string().min(1),
});

export type AdvanceStatusBody = z.infer<typeof advanceStatusBodySchema>;
