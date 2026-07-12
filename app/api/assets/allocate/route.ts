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
    const { assetId, userId, departmentId, expectedReturnDate, checkOutNote } = body;

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    if (!userId && !departmentId) {
      return NextResponse.json({ error: "Please specify a User or a Department for allocation" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json({ error: `Asset is currently ${asset.status.toLowerCase()} and cannot be allocated` }, { status: 400 });
    }

    // Determine target name for logging
    let targetName = "";
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u) targetName = `User: ${u.name}`;
    } else if (departmentId) {
      const d = await prisma.department.findUnique({ where: { id: departmentId } });
      if (d) targetName = `Department: ${d.name}`;
    }

    const allocation = await prisma.allocation.create({
      data: {
        assetId,
        userId: userId || null,
        departmentId: departmentId || null,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        checkOutNote: checkOutNote || null,
        status: "ACTIVE",
      },
    });

    await prisma.asset.update({
      where: { id: assetId },
      data: { status: "ALLOCATED" },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ALLOCATE_ASSET",
        details: `Asset "${asset.name}" (S/N: ${asset.serialNumber}) allocated to ${targetName} by ${currentUser.name}`,
        userId: currentUser.id,
      },
    });

    return NextResponse.json(allocation, { status: 201 });
  } catch (error: any) {
    console.error("POST allocate error:", error);
    return NextResponse.json({ error: "Failed to allocate asset" }, { status: 500 });
  }
}
