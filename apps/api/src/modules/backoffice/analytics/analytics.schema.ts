import { z } from 'zod/v4';

export const revenueTrendQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
});

export type RevenueTrendQuery = z.infer<typeof revenueTrendQuerySchema>;

export const topProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
