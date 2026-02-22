// app/api/profile/route.ts - Customer profile update & delete
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) return unauthorizedResponse();

    return successResponse({ user });
  } catch {
    return errorResponse('Failed to fetch profile', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return unauthorizedResponse();

    const body = await req.json();
    const { name, phone, address, currentPassword, newPassword } = body;

    const data: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim().length >= 2) data.name = name.trim();
    if (typeof phone === 'string') data.phone = phone.replace(/\D/g, '').slice(-11) || null;
    if (typeof address === 'string') data.address = address.trim() || null;

    if (typeof newPassword === 'string' && newPassword.length >= 6) {
      if (!currentPassword) return errorResponse('Current password required to change password');
      const existing = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!existing) return unauthorizedResponse();
      const valid = await bcrypt.compare(currentPassword, existing.password);
      if (!valid) return errorResponse('Current password is incorrect');
      data.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(data).length === 0) return errorResponse('No valid fields to update');

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
      },
    });

    return successResponse({ user });
  } catch {
    return errorResponse('Failed to update profile', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) return unauthorizedResponse();

    const { password } = await req.json();
    if (!password) return errorResponse('Password required to delete account');

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return unauthorizedResponse();
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse('Invalid password');

    if (user.role === 'ADMIN') return errorResponse('Admin accounts cannot be deleted via profile');

    await prisma.user.delete({ where: { id: payload.userId } });

    return successResponse({ message: 'Account deleted successfully' });
  } catch {
    return errorResponse('Failed to delete account', 500);
  }
}
