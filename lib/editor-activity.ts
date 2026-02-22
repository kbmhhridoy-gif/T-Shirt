import { prisma } from '@/lib/prisma';

export type EditorAction = 'CREATE' | 'UPDATE' | 'DELETE';

export async function logEditorActivity(
  editorId: string,
  action: EditorAction,
  productId?: string
): Promise<void> {
  try {
    const client = prisma as unknown as { editorActivity?: { create: (args: { data: object }) => Promise<unknown> } };
    if (client.editorActivity?.create) {
      await client.editorActivity.create({
        data: { editorId, action, productId: productId ?? null },
      });
    }
  } catch (e) {
    console.error('Editor activity log failed:', e);
  }
}
