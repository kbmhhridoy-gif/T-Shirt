// app/api/payments/bkash/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeBkashPayment } from '@/lib/payments';
import { onPaymentSuccess } from '@/lib/order-complete';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get('paymentID');
  const status = searchParams.get('status');

  if (status === 'cancel' || status === 'failure') {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=failed`
    );
  }

  if (!paymentID) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=failed`
    );
  }

  try {
    const success = await executeBkashPayment(paymentID);
    const order = await prisma.order.findFirst({
      where: { paymentId: paymentID },
    });

    if (order && success) {
      await onPaymentSuccess(order.id);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation/${order.id}`
      );
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=failed`
    );
  } catch (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/checkout?payment=failed`
    );
  }
}
