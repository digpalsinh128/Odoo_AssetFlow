import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Only get bookable assets
    const assets = await prisma.asset.findMany({
      where: { isBookable: true },
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } }
        }
      }
    });

    const reportData = assets.map(asset => {
      let totalHoursBooked = 0;
      
      asset.bookings.forEach(booking => {
        const diff = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
        totalHoursBooked += diff / (1000 * 60 * 60);
      });

      return {
        assetName: asset.name,
        serialNumber: asset.serialNumber,
        totalBookings: asset.bookings.length,
        totalHoursBooked: Math.round(totalHoursBooked * 10) / 10 // 1 decimal place
      };
    });

    // Sort by most hours booked
    reportData.sort((a, b) => b.totalHoursBooked - a.totalHoursBooked);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating utilization report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

