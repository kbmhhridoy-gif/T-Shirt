// app/api/payments/bkash/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeBkashPayment } from '@/lib/payments';

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
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID', status: 'PROCESSING' },
      });
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
