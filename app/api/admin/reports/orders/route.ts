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

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { include: { product: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = orders.map((o) => {
      const phone = (o.shippingAddr || '').split(',')[1]?.trim() || '—';
      return {
        orderId: o.id,
        customerName: o.user.name,
        phone,
        paymentMethod: o.paymentMethod,
        amount: o.totalAmount,
        status: o.status,
        date: new Date(o.createdAt).toLocaleDateString('en-BD'),
      };
    });

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Orders');
      sheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 28 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
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
      doc.moveDown(1);
      doc.fontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString('en-BD')}`);
      doc.moveDown(1);
      doc.text('Order ID', 50, doc.y, { continued: true });
      doc.text('Customer', 200, doc.y, { continued: true });
      doc.text('Phone', 320, doc.y, { continued: true });
      doc.text('Payment', 400, doc.y, { continued: true });
      doc.text('Amount', 460, doc.y, { continued: true });
      doc.text('Status', 520, doc.y, { continued: true });
      doc.text('Date', 580, doc.y);
      doc.moveDown(0.5);
      const startY = doc.y;
      rows.slice(0, 40).forEach((r, i) => {
        doc.fontSize(9).text(r.orderId.slice(-8), 50, startY + i * 18, { continued: true });
        doc.text((r.customerName || '').slice(0, 15), 200, startY + i * 18, { continued: true });
        doc.text(r.phone, 320, startY + i * 18, { continued: true });
        doc.text(r.paymentMethod, 400, startY + i * 18, { continued: true });
        doc.text(`৳${r.amount}`, 460, startY + i * 18, { continued: true });
        doc.text(r.status, 520, startY + i * 18, { continued: true });
        doc.text(r.date, 580, startY + i * 18);
      });
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      });
      return new NextResponse(pdfBuffer, {
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
