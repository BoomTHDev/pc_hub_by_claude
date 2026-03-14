import type { Request, Response } from 'express';
import * as brandAdminService from './brand-admin.service.js';
import {
  brandAdminListQuerySchema,
  brandIdParamSchema,
  createBrandBodySchema,
  updateBrandBodySchema,
} from './brand-admin.schema.js';
import { sendSuccess } from '../../../common/response.js';
import { sendPaginatedSuccess } from '../../../common/pagination.js';

export async function list(req: Request, res: Response): Promise<void> {
  const query = brandAdminListQuerySchema.parse(req.query);
  const result = await brandAdminService.listBrands(query);

  sendPaginatedSuccess({
    res,
    message: 'Brands retrieved',
    data: result.data,
    pagination: result.pagination,
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createBrandBodySchema.parse(req.body);
  const brand = await brandAdminService.createBrand(body);

  sendSuccess({ res, message: 'Brand created', data: brand, statusCode: 201 });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { brandId } = brandIdParamSchema.parse(req.params);
  const body = updateBrandBodySchema.parse(req.body);
  const brand = await brandAdminService.updateBrand(brandId, body);

  sendSuccess({ res, message: 'Brand updated', data: brand });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { brandId } = brandIdParamSchema.parse(req.params);
  await brandAdminService.deleteBrand(brandId);

  sendSuccess({ res, message: 'Brand deleted' });
}

export async function toggleActive(req: Request, res: Response): Promise<void> {
  const { brandId } = brandIdParamSchema.parse(req.params);
  const result = await brandAdminService.toggleActive(brandId);

  const action = result.isActive ? 'activated' : 'deactivated';
  sendSuccess({ res, message: `Brand ${action}`, data: result });
}
