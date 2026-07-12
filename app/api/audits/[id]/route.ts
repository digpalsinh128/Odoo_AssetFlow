import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const audit = await prisma.auditCycle.findUnique({
      where: { id },
      include: {
        auditors: { include: { user: true } },
        items: { include: { asset: true } }
      }
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit cycle not found' }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { status } = data;

    if (status !== 'CLOSED') {
      return NextResponse.json({ error: 'Only closing is supported via this endpoint' }, { status: 400 });
    }

    const audit = await prisma.auditCycle.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!audit || audit.status === 'CLOSED') {
      return NextResponse.json({ error: 'Audit cycle not found or already closed' }, { status: 400 });
    }

    // Start transaction to close cycle and update MISSING assets to LOST
    await prisma.$transaction(async (tx) => {
      // 1. Close cycle
      await tx.auditCycle.update({
        where: { id },
        data: { status: 'CLOSED' }
      });

      // 2. Find all MISSING items and update their parent Asset
      const missingItems = audit.items.filter(item => item.status === 'MISSING');
      for (const item of missingItems) {
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: 'LOST' }
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Audit closed successfully' });
  } catch (error) {
    console.error('Error closing audit:', error);
    return NextResponse.json({ error: 'Failed to close audit' }, { status: 500 });
  }
}
