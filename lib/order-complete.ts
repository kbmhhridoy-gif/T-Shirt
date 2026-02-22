// lib/order-complete.ts — shared logic after successful payment
import { prisma } from '@/lib/prisma';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email';

export async function onPaymentSuccess(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } }, user: true },
  });
  if (!order || order.paymentStatus === 'PAID') return;

  for (const item of order.orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  let invoiceFilename: string | null = null;
  try {
    invoiceFilename = await generateInvoicePdf(order as any);
  } catch (e) {
    console.error('Invoice generation failed:', e);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'PAID', status: 'PROCESSING', invoicePath: invoiceFilename },
  });

  const settings = await prisma.siteSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  try {
    await sendOrderConfirmation({
      to: order.user.email,
      customerName: order.user.name,
      orderId: order.id,
      totalAmount: order.totalAmount,
      invoiceFilename,
    });
    if (settings?.adminEmail) {
      await sendAdminOrderNotification({
        adminEmail: settings.adminEmail,
        orderId: order.id,
        customerName: order.user.name,
        totalAmount: order.totalAmount,
        invoiceFilename,
      });
    }
  } catch (e) {
    console.error('Email send failed:', e);
  }
}
