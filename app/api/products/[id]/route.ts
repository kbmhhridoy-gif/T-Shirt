// app/api/products/[id]/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';
import { logEditorActivity } from '@/lib/editor-activity';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true } },
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return errorResponse('Product not found', 404);

    // Hide inactive (soft-deleted) products from public; admin/editor can still view
    const user = await getUserFromRequest(req);
    const canViewInactive = user && ['ADMIN', 'EDITOR'].includes(user.role);
    if (!product.isActive && !canViewInactive) {
      return errorResponse('Product not found', 404);
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    return successResponse({ product: { ...product, avgRating } });
  } catch (error) {
    return errorResponse('Failed to fetch product', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (!['ADMIN', 'EDITOR'].includes(user.role)) {
      return forbiddenResponse('Access denied');
    }

    const body = await req.json();
    const {
      title,
      description,
      price,
      comparePrice,
      image,
      images,
      availableCuts,
      sizes,
      colors,
      stock,
      isFeatured,
      isActive,
      tags,
    } = body;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(comparePrice !== undefined && {
          comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        }),
        ...(image && { image }),
        ...(images && { images }),
        ...(availableCuts && { availableCuts }),
        ...(sizes && { sizes }),
        ...(colors && { colors }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
        ...(tags && { tags }),
      },
    });

    await logEditorActivity(user.userId, 'UPDATE', params.id);

    return successResponse({ product });
  } catch (error) {
    return errorResponse('Failed to update product', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (!['ADMIN', 'EDITOR'].includes(user.role)) {
      return forbiddenResponse('Access denied');
    }

    // Soft delete: set isActive=false to keep order history safe
    await logEditorActivity(user.userId, 'DELETE', params.id);
    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return successResponse({ message: 'Product deleted successfully' });
  } catch (error) {
    return errorResponse('Failed to delete product', 500);
  }
}
