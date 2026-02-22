// app/api/orders/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          orderItems: {
            include: { product: { select: { title: true, image: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return successResponse({ orders, pagination: { total, page, limit } });
  } catch (error) {
    return errorResponse('Failed to fetch orders', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();

    const { items, paymentMethod, shippingAddr, notes } = await req.json();

    if (!items?.length || !paymentMethod) {
      return errorResponse('Missing required fields');
    }

    // Calculate total from DB prices (prevents price manipulation)
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        selectedCut: item.selectedCut,
      };
    });

    const shippingCost = subtotal >= 2000 ? 0 : 80;
    const totalAmount = subtotal + shippingCost;

    const order = await prisma.order.create({
      data: {
        userId: user.userId,
        totalAmount,
        subtotal,
        shippingCost,
        paymentMethod,
        shippingAddr,
        notes,
        orderItems: { create: orderItems },
      },
      include: { orderItems: true },
    });

    return successResponse({ order }, 201);
  } catch (error: any) {
    console.error('Order create error:', error);
    return errorResponse(error.message || 'Failed to create order', 500);
  }
}
