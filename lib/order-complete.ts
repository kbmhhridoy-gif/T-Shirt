// lib/order-complete.ts — shared logic after successful payment
import { prisma } from '@/lib/prisma';
import { generateInvoicePdf } from '@/lib/invoice-pdf';
import { sendOrderConfirmation, sendAdminOrderNotification } from '@/lib/email';

export async function onPaymentSuccess(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { product: true } },
      user: true,
    },
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
    // Build a safe shape for invoice generation for both registered + guest orders
    const billingName = order.user?.name || order.guestName || 'Guest Customer';
    const billingEmail = order.user?.email || order.guestEmail || 'no-email@example.com';
    const billingPhone = order.user?.phone || order.guestPhone || null;

    const orderForInvoice: any = {
      ...order,
      user: {
        name: billingName,
        email: billingEmail,
        phone: billingPhone,
      },
    };

    invoiceFilename = await generateInvoicePdf(orderForInvoice);
  } catch (e) {
    console.error('Invoice generation failed:', e);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'PAID', status: 'PROCESSING', invoicePath: invoiceFilename },
  });

  const settings = await prisma.siteSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  try {
    const customerEmail = order.user?.email || order.guestEmail;
    const customerName = order.user?.name || order.guestName || 'Customer';

    if (customerEmail) {
      await sendOrderConfirmation({
        to: customerEmail,
        customerName,
        orderId: order.id,
        totalAmount: order.totalAmount,
        invoiceFilename,
      });
    }
    if (settings?.adminEmail) {
      await sendAdminOrderNotification({
        adminEmail: settings.adminEmail,
        orderId: order.id,
        customerName,
        totalAmount: order.totalAmount,
        invoiceFilename,
      });
    }
  } catch (e) {
    console.error('Email send failed:', e);
  }
}
