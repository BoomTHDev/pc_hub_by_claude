import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { categoryAdminRouter } from './categories/category-admin.routes.js';
import { brandAdminRouter } from './brands/brand-admin.routes.js';
import { productAdminRouter } from './products/product-admin.routes.js';

export const backofficeRouter = Router();

// All backoffice routes require authentication
backofficeRouter.use(requireAuth);

backofficeRouter.use('/categories', categoryAdminRouter);
backofficeRouter.use('/brands', brandAdminRouter);
backofficeRouter.use('/products', productAdminRouter);
