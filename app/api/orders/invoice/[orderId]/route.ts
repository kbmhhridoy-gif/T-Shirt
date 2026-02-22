// app/api/orders/invoice/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const INVOICES_DIR = path.join(process.cwd(), 'invoices');

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, invoicePath: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const isAdmin = user.role === 'ADMIN';
    if (order.userId !== user.userId && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    if (!order.invoicePath) {
      return NextResponse.json({ success: false, message: 'Invoice not available' }, { status: 404 });
    }

    const filepath = path.join(INVOICES_DIR, order.invoicePath);
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
    }
    const buf = fs.readFileSync(filepath);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${orderId}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to get invoice' }, { status: 500 });
  }
}
