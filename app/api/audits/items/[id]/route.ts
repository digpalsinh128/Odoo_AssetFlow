import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { status, notes } = data;

    // Validate cycle is not closed
    const item = await prisma.auditItem.findUnique({
      where: { id },
      include: { auditCycle: true }
    });

    if (!item) {
      return NextResponse.json({ error: 'Audit item not found' }, { status: 404 });
    }

    if (item.auditCycle.status === 'CLOSED') {
      return NextResponse.json({ error: 'Cannot edit items in a closed audit cycle' }, { status: 400 });
    }

    const updated = await prisma.auditItem.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating audit item:', error);
    return NextResponse.json({ error: 'Failed to update audit item' }, { status: 500 });
  }
}
