// app/api/auth/me/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

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
        role: true,
        isBlocked: true,
        avatar: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) return unauthorizedResponse('User not found');
    if (user.isBlocked) return forbiddenResponse('Account suspended');

    return successResponse({ user });
  } catch (error) {
    return unauthorizedResponse();
  }
}
