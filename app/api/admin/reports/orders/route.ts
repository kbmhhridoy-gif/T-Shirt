// app/api/admin/reports/orders/route.ts — PDF and Excel order reports
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format'); // 'pdf' | 'xlsx'

    // Single optimized query: orders with user, order items, and product details
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        orderItems: {
          include: { product: { select: { title: true, price: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = orders.map((o) => {
      const phone = o.user.phone || (o.shippingAddr || '').split(',')[1]?.trim() || '—';
      return {
        orderId: o.id,
        customerName: o.user.name,
        email: o.user.email,
        phone,
        paymentMethod: o.paymentMethod,
        amount: o.totalAmount,
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString('en-BD'),
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        orderItems: o.orderItems.map((oi) => ({
          title: oi.product?.title,
          quantity: oi.quantity,
          price: oi.price,
          total: oi.price * oi.quantity,
        })),
      };
    });

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Orders');
      sheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 28 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Email', key: 'email', width: 24 },
        { header: 'Phone', key: 'phone', width: 14 },
        { header: 'Payment Method', key: 'paymentMethod', width: 12 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Date', key: 'date', width: 14 },
      ];
      sheet.addRows(rows);
      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="orders-report.xlsx"',
        },
      });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.fontSize(18).text('Orders Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString('en-BD')}`, { align: 'center' });
      doc.moveDown(1.5);
      doc.fillColor('#000');
      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const r = rows[i];
        if (i > 0) doc.moveDown(1);
        doc.fontSize(11).text(`Order #${r.orderId.slice(-8).toUpperCase()}`, { underline: true });
        doc.fontSize(9);
        doc.text(`Customer: ${r.customerName || '—'}`);
        doc.text(`Email: ${r.email || '—'}`);
        doc.text(`Phone: ${r.phone || '—'}`);
        doc.text(`Payment: ${r.paymentMethod} | Status: ${r.status} | Date: ${r.date}`);
        doc.text('Items:');
        (r.orderItems || []).forEach((item: { title: string; quantity: number; price: number; total: number }) => {
          doc.text(`  • ${item.title} × ${item.quantity} @ ৳${item.price?.toLocaleString()} = ৳${item.total?.toLocaleString()}`);
        });
        doc.text(`Subtotal: ৳${(r.subtotal ?? 0).toLocaleString()} | Shipping: ৳${(r.shippingCost ?? 0).toLocaleString()} | Total: ৳${(r.amount ?? 0).toLocaleString()}`);
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }
      }
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      });
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="orders-report.pdf"',
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Use ?format=pdf or ?format=xlsx' }, { status: 400 });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: false, message: 'Report failed' }, { status: 500 });
  }
}
