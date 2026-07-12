import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        ...(assetId && { assetId }),
      },
      include: {
        asset: true,
        raisedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { assetId, raisedById, issue, priority, photoUrl } = data;

    if (!assetId || !raisedById || !issue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedById,
        issue,
        priority: priority || 'MEDIUM',
        photoUrl: photoUrl || null,
        status: 'PENDING',
      },
      include: {
        asset: true,
        raisedBy: true,
      }
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}

