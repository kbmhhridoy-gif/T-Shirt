// lib/invoice-pdf.ts
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

export type OrderForInvoice = {
  id: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: Date;
  shippingAddr: string | null;
  orderItems: Array<{
    quantity: number;
    price: number;
    selectedSize: string;
    selectedColor: string;
    selectedCut: string;
    product: { title: string };
  }>;
  user: { name: string; email: string; phone?: string | null };
};

const INVOICES_DIR = path.join(process.cwd(), 'invoices');

export async function ensureInvoicesDir(): Promise<string> {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }
  return INVOICES_DIR;
}

export async function generateInvoicePdf(order: OrderForInvoice): Promise<string> {
  if (!order) throw new Error('Order required');
  await ensureInvoicesDir();
  const filename = `invoice-${order.id}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'Thread Haus';

  doc.fontSize(22).text(siteName, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text('INVOICE', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(10).fillColor('#000');
  doc.text(`Order ID: ${order.id}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-BD', { dateStyle: 'long' })}`);
  doc.text(`Payment: ${order.paymentMethod}`);
  doc.moveDown(1);

  doc.text('Bill To:', { continued: false });
  doc.text(order.user.name);
  doc.text(order.user.email);
  if (order.user.phone) doc.text(order.user.phone);
  if (order.shippingAddr) doc.text(order.shippingAddr);
  doc.moveDown(1.5);

  doc.fontSize(11).text('Items', { underline: true });
  doc.moveDown(0.5);
  let y = doc.y;
  doc.fontSize(9);
  (order.orderItems || []).forEach((item: any) => {
    const line = `${item.product?.title || 'Product'} (${item.selectedCut}, ${item.selectedSize}) x ${item.quantity} — ৳${(item.price * item.quantity).toLocaleString()}`;
    doc.text(line);
  });
  doc.moveDown(1);
  doc.text(`Subtotal: ৳${(order.subtotal ?? 0).toLocaleString()}`);
  doc.text(`Shipping: ৳${(order.shippingCost ?? 0).toLocaleString()}`);
  doc.fontSize(11).text(`Total: ৳${(order.totalAmount ?? 0).toLocaleString()}`, { underline: true });
  doc.moveDown(2);
  doc.fontSize(9).fillColor('#666').text('Thank you for your order.', { align: 'center' });

  doc.end();
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return filename;
}
