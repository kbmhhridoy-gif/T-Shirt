import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return successResponse({ message: 'Already logged out' });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });

    return successResponse({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Logout failed', 500);
  }
}

