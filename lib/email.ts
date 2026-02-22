// lib/email.ts
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';
const INVOICES_DIR = path.join(process.cwd(), 'invoices');

export async function sendOrderConfirmation(params: {
  to: string;
  customerName: string;
  orderId: string;
  totalAmount: number;
  invoiceFilename: string | null;
}) {
  const { to, customerName, orderId, totalAmount, invoiceFilename } = params;
  const attachments: nodemailer.SendMailOptions['attachments'] = [];
  if (invoiceFilename) {
    const filepath = path.join(INVOICES_DIR, invoiceFilename);
    if (fs.existsSync(filepath)) {
      attachments.push({ filename: `invoice-${orderId}.pdf`, path: filepath });
    }
  }
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order Confirmed #${orderId.slice(-8).toUpperCase()}`,
    text: `Hi ${customerName}, your order #${orderId.slice(-8).toUpperCase()} has been confirmed. Total: ৳${totalAmount.toLocaleString()}. ${attachments.length ? 'Invoice is attached.' : ''}`,
    html: `<p>Hi ${customerName},</p><p>Your order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been confirmed.</p><p>Total: ৳${totalAmount.toLocaleString()}</p>${attachments.length ? '<p>Invoice is attached.</p>' : ''}`,
    attachments,
  });
}

export async function sendAdminOrderNotification(params: {
  adminEmail: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  invoiceFilename: string | null;
}) {
  const { adminEmail, orderId, customerName, totalAmount, invoiceFilename } = params;
  if (!adminEmail) return;
  const attachments: nodemailer.SendMailOptions['attachments'] = [];
  if (invoiceFilename) {
    const filepath = path.join(INVOICES_DIR, invoiceFilename);
    if (fs.existsSync(filepath)) {
      attachments.push({ filename: `invoice-${orderId}.pdf`, path: filepath });
    }
  }
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `New Order #${orderId.slice(-8).toUpperCase()} from ${customerName}`,
    text: `New order received. Order #${orderId.slice(-8).toUpperCase()}, Customer: ${customerName}, Total: ৳${totalAmount.toLocaleString()}. ${attachments.length ? 'Invoice attached.' : ''}`,
    html: `<p>New order received.</p><p>Order #${orderId.slice(-8).toUpperCase()}</p><p>Customer: ${customerName}</p><p>Total: ৳${totalAmount.toLocaleString()}</p>${attachments.length ? '<p>Invoice attached.</p>' : ''}`,
    attachments,
  });
}
