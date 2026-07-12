import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const id = params.id;

    const existingBooking = await prisma.booking.findUnique({ where: { id } });
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Cancel Booking
    if (data.status === 'CANCELLED') {
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json(updated);
    }

    // Reschedule Booking
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);

      if (start >= end) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }

      // Check overlap again, excluding THIS booking
      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          assetId: existingBooking.assetId,
          id: { not: id },
          status: { not: 'CANCELLED' },
          startTime: { lt: end },
          endTime: { gt: start },
        }
      });

      if (overlappingBooking) {
        return NextResponse.json({ 
          error: 'Rescheduled time overlaps with an existing booking', 
          overlappingBooking 
        }, { status: 400 });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          startTime: start,
          endTime: end,
          status: 'UPCOMING', // Or recalculate dynamically
        }
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
