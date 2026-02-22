// app/api/settings/public/route.ts — payment method toggles and numbers for checkout
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: {
        paymentBkashOn: true,
        paymentNagadOn: true,
        paymentCardOn: true,
        bkashNumber: true,
        nagadNumber: true,
      },
    });
    return NextResponse.json({
      success: true,
      paymentBkashOn: settings?.paymentBkashOn ?? true,
      paymentNagadOn: settings?.paymentNagadOn ?? true,
      paymentCardOn: settings?.paymentCardOn ?? true,
      bkashNumber: settings?.bkashNumber ?? null,
      nagadNumber: settings?.nagadNumber ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, paymentBkashOn: true, paymentNagadOn: true, paymentCardOn: true },
      { status: 200 }
    );
  }
}
