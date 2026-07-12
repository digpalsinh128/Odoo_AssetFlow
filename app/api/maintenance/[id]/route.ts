import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const { id } = await params;
    const { status, technicianName } = data;

    const requestToUpdate = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!requestToUpdate) {
      return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
    }

    const currentStatus = requestToUpdate.status;

    // Validate valid transitions based on strict lifecycle
    // PENDING → APPROVED | REJECTED
    // APPROVED → TECHNICIAN_ASSIGNED
    // TECHNICIAN_ASSIGNED → IN_PROGRESS
    // IN_PROGRESS → RESOLVED

    const validTransitions: Record<string, string[]> = {
      'PENDING': ['APPROVED', 'REJECTED'],
      'APPROVED': ['TECHNICIAN_ASSIGNED'],
      'TECHNICIAN_ASSIGNED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['RESOLVED'],
      'REJECTED': [],
      'RESOLVED': []
    };

    if (status && !validTransitions[currentStatus].includes(status)) {
      return NextResponse.json({ error: `Invalid transition from ${currentStatus} to ${status}` }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    
    // Require technician name when assigning
    if (status === 'TECHNICIAN_ASSIGNED') {
      if (!technicianName) {
        return NextResponse.json({ error: 'Technician name is required for assignment' }, { status: 400 });
      }
      updateData.technicianName = technicianName;
    }

    // When resolved, record timestamp
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    // Run in a transaction to safely update both models
    const [updatedRequest] = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id },
        data: updateData,
      });

      // Handle linked Asset status changes
      if (status === 'APPROVED') {
        await tx.asset.update({
          where: { id: requestToUpdate.assetId },
          data: { status: 'UNDER_MAINTENANCE' }
        });
      } else if (status === 'RESOLVED' || status === 'REJECTED') {
        // Technically if rejected, the asset shouldn't be UNDER_MAINTENANCE anyway, 
        // but it's safe to revert it back to AVAILABLE if we just resolved it.
        // Wait, what if the asset was ALLOCATED before?
        // AssetFlow spec says: "On Resolved, set it back to AVAILABLE."
        if (status === 'RESOLVED') {
          await tx.asset.update({
            where: { id: requestToUpdate.assetId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return [updated];
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to update maintenance request' }, { status: 500 });
  }
}
