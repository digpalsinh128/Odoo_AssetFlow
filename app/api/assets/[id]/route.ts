import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        allocations: {
          include: {
            user: true,
            department: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        maintenance: {
          include: {
            raisedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching asset details:', error);
    return NextResponse.json({ error: 'Failed to fetch asset details' }, { status: 500 });
  }
}
