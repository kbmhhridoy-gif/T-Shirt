// app/api/admin/contributions/editors/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin only');

    const activities = await prisma.editorActivity.groupBy({
      by: ['editorId', 'action'],
      _count: true,
    });

    const editorIds = Array.from(new Set(activities.map((a) => a.editorId)));
    const editors = await prisma.user.findMany({
      where: { id: { in: editorIds } },
      select: { id: true, name: true, email: true, role: true },
    });

    const statsByEditor: Record<
      string,
      { creates: number; updates: number; deletes: number; total: number }
    > = {};
    editorIds.forEach((id) => {
      statsByEditor[id] = { creates: 0, updates: 0, deletes: 0, total: 0 };
    });
    activities.forEach((a) => {
      const s = statsByEditor[a.editorId];
      if (!s) return;
      const count = a._count;
      if (a.action === 'CREATE') s.creates = count;
      else if (a.action === 'UPDATE') s.updates = count;
      else if (a.action === 'DELETE') s.deletes = count;
      s.total = s.creates + s.updates + s.deletes;
    });

    const list = editors.map((e) => {
      const s = statsByEditor[e.id];
      return {
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        creates: s?.creates ?? 0,
        updates: s?.updates ?? 0,
        deletes: s?.deletes ?? 0,
        total: (s?.creates ?? 0) + (s?.updates ?? 0) + (s?.deletes ?? 0),
      };
    });

    // Sort by total edits descending
    list.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

    return successResponse({ editors: list });
  } catch (error) {
    console.error('Editor contributions error:', error);
    return errorResponse('Failed to fetch editor contributions', 500);
  }
}
