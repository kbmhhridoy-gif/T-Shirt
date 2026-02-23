// app/api/payments/otp/verify/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { onPaymentSuccess } from '@/lib/order-complete';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { phone, otp, orderId } = await req.json();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-11);
    const otpStr = String(otp || '').trim();

    if (!normalizedPhone || !otpStr) {
      return errorResponse('Phone and OTP are required', 400);
    }
    if (!orderId) return errorResponse('Order ID is required', 400);

    const order = await prisma.order.findFirst({
      where: user
        ? { id: orderId, userId: user.userId }
        : { id: orderId, userId: null, guestPhone: normalizedPhone },
      include: {
        orderItems: { include: { product: true } },
        user: true,
      },
    });
    if (!order) return errorResponse('Order not found', 404);
    if (order.paymentStatus === 'PAID') {
      return successResponse({
        verified: true,
        orderId,
        invoicePath: order.invoicePath ?? undefined,
      });
    }

    const record = await prisma.otp.findFirst({
      where: {
        phone: normalizedPhone,
        orderId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return errorResponse('OTP expired or not found. Request a new one.', 400);
    }

    const devBypass = process.env.NODE_ENV === 'development' && otpStr === '123456';
    if (record.otp !== otpStr && !devBypass) {
      return errorResponse('Invalid OTP', 400);
    }

    await prisma.otp.deleteMany({ where: { id: record.id } });
    await onPaymentSuccess(order.id);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: { id: true, invoicePath: true },
    });
    return successResponse({
      verified: true,
      orderId: updated!.id,
      invoicePath: updated!.invoicePath ?? undefined,
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return errorResponse('Failed to verify OTP', 500);
  }
}
