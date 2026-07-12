import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to determine status dynamically based on current time
const getDynamicStatus = (booking: any) => {
  if (booking.status === 'CANCELLED') return 'CANCELLED';
  
  const now = new Date();
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  
  if (now < start) return 'UPCOMING';
  if (now >= start && now <= end) return 'ONGOING';
  return 'COMPLETED';
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');

    const bookings = await prisma.booking.findMany({
      where: {
        ...(assetId && { assetId }),
      },
      include: {
        asset: true,
        bookedBy: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Dynamically update status for presentation
    const dynamicBookings = bookings.map(b => ({
      ...b,
      status: getDynamicStatus(b)
    }));

    return NextResponse.json(dynamicBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { assetId, bookedById, startTime, endTime } = data;

    if (!assetId || !bookedById || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Verify asset is bookable and available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.isBookable) {
      return NextResponse.json({ error: 'Asset is not bookable' }, { status: 400 });
    }
    if (asset.status === 'UNDER_MAINTENANCE') {
      return NextResponse.json({ error: 'Asset is currently under maintenance and cannot be booked' }, { status: 400 });
    }

    // OVERLAP RULE: newStart < existingEnd AND newEnd > existingStart
    // Boundary is inclusive of "touching but not overlapping" (so < and > strictly, not <= or >=)
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { not: 'CANCELLED' },
        startTime: { lt: end },
        endTime: { gt: start },
      }
    });

    if (overlappingBooking) {
      return NextResponse.json({ 
        error: 'Booking overlaps with an existing booking', 
        overlappingBooking 
      }, { status: 400 });
    }

    const newBooking = await prisma.booking.create({
      data: {
        assetId,
        bookedById,
        startTime: start,
        endTime: end,
        status: 'UPCOMING',
      },
      include: {
        asset: true,
        bookedBy: true,
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'BOOKING_CREATED',
        entity: `Asset:${asset.serialNumber}`,
        userId: bookedById,
        details: JSON.stringify({ 
          asset: asset.name,
          start: start.toISOString(),
          end: end.toISOString()
        })
      }
    });

    newBooking.status = getDynamicStatus(newBooking);

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}


