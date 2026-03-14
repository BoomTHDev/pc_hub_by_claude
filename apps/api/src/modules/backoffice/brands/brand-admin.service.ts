import { prisma } from '../../../config/database.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { NotFoundError, ConflictError } from '../../../common/errors.js';
import { buildPaginationMeta } from '../../../common/pagination.js';
import type {
  BrandAdminListQuery,
  CreateBrandBody,
  UpdateBrandBody,
} from './brand-admin.schema.js';

const selectFields = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  logoPublicId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandSelect;

export async function listBrands(query: BrandAdminListQuery) {
  const where: Prisma.BrandWhereInput = {};

  if (query.search) {
    where.name = { contains: query.search };
  }

  const [data, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      select: selectFields,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function createBrand(body: CreateBrandBody) {
  try {
    return await prisma.brand.create({
      data: {
        name: body.name,
        slug: body.slug,
        isActive: body.isActive,
      },
      select: selectFields,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Brand with this slug already exists');
    }
    throw error;
  }
}

export async function updateBrand(brandId: number, body: UpdateBrandBody) {
  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
  });
  if (!existing) {
    throw new NotFoundError('Brand not found');
  }

  try {
    return await prisma.brand.update({
      where: { id: brandId },
      data: body,
      select: selectFields,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Brand with this slug already exists');
    }
    throw error;
  }
}

export async function deleteBrand(brandId: number) {
  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
  });
  if (!existing) {
    throw new NotFoundError('Brand not found');
  }

  const productCount = await prisma.product.count({ where: { brandId } });
  if (productCount > 0) {
    throw new ConflictError('Cannot delete brand with existing products');
  }

  await prisma.brand.delete({ where: { id: brandId } });
}

export async function toggleActive(brandId: number) {
  const existing = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    throw new NotFoundError('Brand not found');
  }

  return await prisma.brand.update({
    where: { id: brandId },
    data: { isActive: !existing.isActive },
    select: { id: true, isActive: true },
  });
}
