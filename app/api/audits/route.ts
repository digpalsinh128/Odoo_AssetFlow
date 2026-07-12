import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const audits = await prisma.auditCycle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        auditors: {
          include: { user: true }
        }
      }
    });
    return NextResponse.json(audits);
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { scopeDept, scopeLocation, startDate, endDate, auditorIds } = data;

    if (!startDate || !endDate || !auditorIds || !auditorIds.length) {
      return NextResponse.json({ error: 'Missing required fields (dates and auditors)' }, { status: 400 });
    }

    // Determine scope filter for Assets
    const assetFilter: any = {};
    if (scopeDept) assetFilter.departmentId = scopeDept;
    if (scopeLocation) assetFilter.location = { contains: scopeLocation };

    // Find all assets in scope
    const assetsInScope = await prisma.asset.findMany({
      where: assetFilter
    });

    if (assetsInScope.length === 0) {
      return NextResponse.json({ error: 'No assets found matching this scope' }, { status: 400 });
    }

    // Start transaction to create Cycle, link Auditors, and auto-generate Items
    const newCycle = await prisma.$transaction(async (tx) => {
      const cycle = await tx.auditCycle.create({
        data: {
          scopeDept: scopeDept || null,
          scopeLocation: scopeLocation || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: 'OPEN',
        }
      });

      // Link auditors
      for (const userId of auditorIds) {
        await tx.auditAuditor.create({
          data: {
            auditCycleId: cycle.id,
            userId: userId
          }
        });
      }

      // Generate items
      const itemsData = assetsInScope.map(asset => ({
        auditCycleId: cycle.id,
        assetId: asset.id,
        status: 'PENDING'
      }));

      await tx.auditItem.createMany({
        data: itemsData
      });

      return cycle;
    });

    return NextResponse.json(newCycle, { status: 201 });
  } catch (error) {
    console.error('Error creating audit cycle:', error);
    return NextResponse.json({ error: 'Failed to create audit cycle' }, { status: 500 });
  }
}
