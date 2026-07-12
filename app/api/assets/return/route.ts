import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.role !== "ADMIN" && currentUser.role !== "ASSET_MANAGER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { assetId, checkInNote } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    // Find the active allocation
    const allocation = await prisma.allocation.findFirst({
      where: {
        assetId,
        status: "ACTIVE",
      },
      include: {
        asset: true,
        user: true,
        department: true,
      },
    });

    if (!allocation) {
      return NextResponse.json({ error: "No active allocation found for this asset" }, { status: 404 });
    }

    // Update allocation
    await prisma.allocation.update({
      where: { id: allocation.id },
      data: {
        status: "RETURNED",
        returnDate: new Date(),
        checkInNote: checkInNote || null,
      },
    });

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "AVAILABLE" },
    });

    // Determine target name for logging
    const targetName = allocation.user
      ? `User: ${allocation.user.name}`
      : allocation.department
      ? `Department: ${allocation.department.name}`
      : "Unknown";

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "RETURN_ASSET",
        details: `Asset "${allocation.asset.name}" (S/N: ${allocation.asset.serialNumber}) returned by ${targetName} (Notes: ${checkInNote || "None"}). Checked in by ${currentUser.name}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json({ message: "Asset returned successfully" });
  } catch (error: any) {
    console.error("POST return error:", error);
    return NextResponse.json({ error: "Failed to return asset" }, { status: 500 });
  }
}
