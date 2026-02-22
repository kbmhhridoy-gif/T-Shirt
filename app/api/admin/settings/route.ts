// app/api/admin/settings/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const settings = await prisma.siteSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    return successResponse(settings || {
      siteName: 'Thread Haus',
      adminEmail: null,
      bannerTitle: 'Thread Haus',
      bannerSubtitle: 'Premium T-Shirts Crafted for the Bold',
      announcementBar: null,
      featuredSection: 'Featured Collection',
      bkashNumber: null,
      nagadNumber: null,
      paymentBkashOn: true,
      paymentNagadOn: true,
      paymentCardOn: true,
    });
  } catch (error) {
    return errorResponse('Failed to fetch settings', 500);
  }
}

const allowedKeys = [
  'siteName', 'adminEmail', 'bannerTitle', 'bannerSubtitle', 'bannerImage',
  'announcementBar', 'featuredSection', 'bkashNumber', 'nagadNumber',
  'paymentBkashOn', 'paymentNagadOn', 'paymentCardOn',
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        if (key.startsWith('payment') && typeof body[key] === 'boolean') data[key] = body[key];
        else if (typeof body[key] === 'string' || body[key] === null) data[key] = body[key];
      }
    }

    const existing = await prisma.siteSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const updated = existing
      ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
      : await prisma.siteSettings.create({
          data: {
            ...data,
            siteName: (data.siteName as string) || 'Thread Haus',
            bannerTitle: (data.bannerTitle as string) || 'Premium T-Shirts',
            bannerSubtitle: (data.bannerSubtitle as string) || 'Crafted for the Bold',
            featuredSection: (data.featuredSection as string) || 'Featured Collection',
          } as any,
        });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('Failed to update settings', 500);
  }
}
