// app/api/payments/stripe/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createStripePaymentIntent } from '@/lib/payments';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return errorResponse('Order not found', 404);

    const { clientSecret, paymentIntentId } = await createStripePaymentIntent(
      order.totalAmount
    );

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: paymentIntentId },
    });

    return successResponse({ clientSecret });
  } catch (error) {
    return errorResponse('Payment initiation failed', 500);
  }
}
