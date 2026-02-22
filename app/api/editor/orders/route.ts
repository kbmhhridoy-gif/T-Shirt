// app/api/editor/orders/route.ts - Editor's assigned orders
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-user';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (authUser.isBlocked) return forbiddenResponse('Your account has been blocked by admin.');
    if (authUser.role === 'EDITOR' && !authUser.isActive) return forbiddenResponse('Your account has been disabled by admin.');
    if (authUser.role !== 'EDITOR') return forbiddenResponse('Editor only');

    const orders = await prisma.order.findMany({
      where: { editorId: authUser.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        orderItems: {
          include: { product: { select: { title: true, image: true, price: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ orders });
  } catch (error) {
    return errorResponse('Failed to fetch orders', 500);
  }
}
