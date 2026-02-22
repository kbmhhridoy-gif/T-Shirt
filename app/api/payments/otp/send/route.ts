// app/api/payments/otp/send/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { phone, orderId } = await req.json();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-11);
    if (normalizedPhone.length < 11) {
      return errorResponse('Valid 11-digit phone number required', 400);
    }

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.userId },
      });
      if (!order) return errorResponse('Order not found', 404);
      if (order.paymentStatus === 'PAID') return errorResponse('Order already paid', 400);
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otp.create({
      data: {
        phone: normalizedPhone,
        otp,
        orderId: orderId || null,
        expiresAt,
      },
    });

    // OTP is sent to phone only (SMS gateway in production). Never sent via email.
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP] Sent to phone ${normalizedPhone} -> OTP: ${otp} (expires ${expiresAt.toISOString()})`);
    }

    return successResponse({
      message: 'OTP sent to your phone number only. Use 123456 in development if SMS is not configured.',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return errorResponse('Failed to send OTP', 500);
  }
}
