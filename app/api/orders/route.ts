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
          user: { select: { name: true, email: true, phone: true } },
          editor: { select: { id: true, name: true, email: true } },
          orderItems: {
            include: { product: { select: { title: true, image: true, price: true } } },
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
    const authUser = await getUserFromRequest(req);
    const isGuest = !authUser;

    if (authUser && authUser.role === 'EDITOR') {
      return forbiddenResponse('Editors cannot place orders. Checkout is only available for customers and admins.');
    }

    const {
      items,
      paymentMethod,
      shippingAddr,
      notes,
      guestName,
      guestPhone,
      guestAddress,
      guestEmail,
    } = await req.json();

    if (!items?.length || !paymentMethod) {
      return errorResponse('Missing required fields');
    }

    // Guest validation: require basic identity + reachable phone/address
    if (isGuest) {
      const nameStr = String(guestName || '').trim();
      const phoneStr = String(guestPhone || '').replace(/\D/g, '').slice(-11);
      const addrStr = String(guestAddress || '').trim();
      const emailStr = String(guestEmail || '').trim();

      if (nameStr.length < 2) {
        return errorResponse('Name is required for guest checkout', 400);
      }
      if (phoneStr.length !== 11) {
        return errorResponse('Valid 11-digit phone number is required for guest checkout', 400);
      }
      if (addrStr.length < 10) {
        return errorResponse('Delivery address is too short', 400);
      }
      if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        return errorResponse('Invalid email address', 400);
      }
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

    // Assign editor (round-robin among active, non-muted editors)
    let editorId: string | null = null;
    const editors = await prisma.user.findMany({
      where: { role: 'EDITOR', isActive: true, isMuted: false },
      select: { id: true },
    });
    if (editors.length > 0) {
      const counts = await prisma.order.groupBy({
        by: ['editorId'],
        where: { editorId: { not: null } },
        _count: true,
      });
      const countMap = Object.fromEntries(counts.map((c) => [c.editorId, c._count]));
      const withCounts = editors.map((e) => ({ id: e.id, count: countMap[e.id] ?? 0 }));
      withCounts.sort((a, b) => a.count - b.count);
      editorId = withCounts[0].id;
    }

    const baseData: any = {
      editorId,
      totalAmount,
      subtotal,
      shippingCost,
      paymentMethod,
      shippingAddr,
      notes,
      orderItems: { create: orderItems },
    };

    if (authUser) {
      baseData.userId = authUser.userId;
    } else {
      baseData.userId = null;
      baseData.guestName = String(guestName || '').trim();
      baseData.guestPhone = String(guestPhone || '').replace(/\D/g, '').slice(-11);
      baseData.guestAddress = String(guestAddress || '').trim();
      baseData.guestEmail = String(guestEmail || '').trim() || null;
    }

    const order = await prisma.order.create({
      data: baseData,
      include: {
        orderItems: true,
        editor: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return successResponse({ order }, 201);
  } catch (error: any) {
    console.error('Order create error:', error);
    return errorResponse(error.message || 'Failed to create order', 500);
  }
}
