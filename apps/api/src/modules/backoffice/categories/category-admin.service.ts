import { prisma } from '../../../config/database.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { NotFoundError, ConflictError } from '../../../common/errors.js';
import { buildPaginationMeta } from '../../../common/pagination.js';
import type {
  CategoryAdminListQuery,
  CreateCategoryBody,
  UpdateCategoryBody,
} from './category-admin.schema.js';

const selectFields = {
  id: true,
  name: true,
  slug: true,
  description: true,
  parentId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export async function listCategories(query: CategoryAdminListQuery) {
  const where: Prisma.CategoryWhereInput = {};

  if (query.search) {
    where.name = { contains: query.search };
  }

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      where,
      select: selectFields,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(query.page, query.limit, total),
  };
}

export async function createCategory(body: CreateCategoryBody) {
  if (body.parentId !== undefined) {
    const parent = await prisma.category.findUnique({
      where: { id: body.parentId },
    });
    if (!parent) {
      throw new NotFoundError('Parent category not found');
    }
  }

  try {
    return await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        parentId: body.parentId,
        isActive: body.isActive,
      },
      select: selectFields,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Category with this slug already exists');
    }
    throw error;
  }
}

export async function updateCategory(categoryId: number, body: UpdateCategoryBody) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  if (body.parentId !== undefined && body.parentId !== null) {
    if (body.parentId === categoryId) {
      throw new ConflictError('Category cannot be its own parent');
    }
    const parent = await prisma.category.findUnique({
      where: { id: body.parentId },
    });
    if (!parent) {
      throw new NotFoundError('Parent category not found');
    }
  }

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: body,
      select: selectFields,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictError('Category with this slug already exists');
    }
    throw error;
  }
}

export async function deleteCategory(categoryId: number) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId } }),
    prisma.category.count({ where: { parentId: categoryId } }),
  ]);

  if (productCount > 0) {
    throw new ConflictError('Cannot delete category with existing products');
  }
  if (childCount > 0) {
    throw new ConflictError('Cannot delete category with child categories');
  }

  await prisma.category.delete({ where: { id: categoryId } });
}

export async function toggleActive(categoryId: number) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    throw new NotFoundError('Category not found');
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { isActive: !existing.isActive },
    select: { id: true, isActive: true },
  });

  return updated;
}
