// app/api/orders/me/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        orderItems: {
          include: {
            product: { select: { title: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ orders });
  } catch (error) {
    return errorResponse('Failed to fetch orders', 500);
  }
}
