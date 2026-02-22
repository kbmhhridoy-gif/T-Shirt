// app/api/payments/bkash/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createBkashPayment } from '@/lib/payments';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { orderId } = await req.json();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return errorResponse('Order not found', 404);

    const { paymentID, bkashURL } = await createBkashPayment(order.totalAmount, orderId);

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: paymentID },
    });

    return successResponse({ bkashURL, paymentID });
  } catch (error: any) {
    console.error('bKash error:', error.response?.data || error.message);
    return errorResponse('bKash payment initiation failed', 500);
  }
}
