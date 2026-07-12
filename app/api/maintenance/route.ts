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

    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("GET maintenance error:", error);
    return NextResponse.json({ error: "Failed to fetch maintenance requests" }, { status: 500 });
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

    // Set asset status to UNDER_MAINTENANCE
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: "UNDER_MAINTENANCE",
      },
    });

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
      },
    });

    const userName = (session.user as any)?.name || "Unknown User";
    const userId = (session.user as any)?.id || null;

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "MAINTENANCE_ASSET",
        details: `Asset "${asset.name}" (S/N: ${asset.serialNumber}) sent to maintenance by ${userName}`,
        userId,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error: any) {
    console.error("POST maintenance error:", error);
    return NextResponse.json({ error: "Failed to create maintenance request" }, { status: 500 });
  }
}
