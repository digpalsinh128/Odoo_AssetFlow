export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        asset: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assetId } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: `Asset is currently ${asset.status.toLowerCase()} and cannot be booked` }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
      },
    });

    const userName = (session.user as any)?.name || "Unknown User";
    const userId = (session.user as any)?.id || null;

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "BOOK_ASSET",
        details: `Asset "${asset.name}" (S/N: ${asset.serialNumber}) booked by ${userName}`,
        userId,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error("POST bookings error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
