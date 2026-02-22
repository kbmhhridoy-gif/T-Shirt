// app/api/orders/[id]/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth-user';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorizedResponse();
    if (authUser.isBlocked) return forbiddenResponse('Your account has been blocked by admin.');
    if (authUser.role === 'EDITOR' && !authUser.isActive) return forbiddenResponse('Your account has been disabled by admin.');

    const { status, paymentStatus, editorId } = await req.json();

    const existing = await prisma.order.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Order not found', 404);

    let canUpdate = false;
    let updateData: Record<string, unknown> = {};

    if (authUser.role === 'ADMIN') {
      canUpdate = true;
      if (status !== undefined) updateData.status = status;
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      if (editorId !== undefined) updateData.editorId = editorId || null;
    } else if (authUser.role === 'EDITOR') {
      if (authUser.isMuted) return forbiddenResponse('You are muted and cannot modify orders.');
      if (existing.editorId !== authUser.id) return forbiddenResponse('Order not assigned to you.');
      canUpdate = true;
      if (status !== undefined) updateData.status = status;
      // Editor cannot change paymentStatus or editorId
    }

    if (!canUpdate) return forbiddenResponse('Access denied');

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: { user: { select: { name: true, email: true } }, editor: { select: { id: true, name: true, email: true } } },
    });

    return successResponse({ order });
  } catch (error) {
    return errorResponse('Failed to update order', 500);
  }
}
