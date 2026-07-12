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

    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.assetCategory.findMany({
      select: { id: true, name: true, fields: true },
    });

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
    });

    const departments = await prisma.department.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });

    return NextResponse.json({ assets, categories, users, departments });
  } catch (error: any) {
    console.error("GET assets error:", error);
    return NextResponse.json({ error: "Failed to fetch assets data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "ADMIN" && user.role !== "ASSET_MANAGER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { name, serialNumber, model, categoryId, customFields } = body;

    if (!name || !serialNumber || !model || !categoryId) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
    }

    const existing = await prisma.asset.findUnique({
      where: { serialNumber },
    });

    if (existing) {
      return NextResponse.json({ error: "Asset with this serial number already exists" }, { status: 400 });
    }

    const newAsset = await prisma.asset.create({
      data: {
        name,
        serialNumber,
        model,
        categoryId,
        status: "AVAILABLE",
        customFields: customFields ? JSON.stringify(customFields) : null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE_ASSET",
        details: `Asset ${name} (S/N: ${serialNumber}) registered by ${user.name}`,
        userId: user.id,
      },
    });

    return NextResponse.json(newAsset, { status: 201 });
  } catch (error: any) {
    console.error("POST assets error:", error);
    return NextResponse.json({ error: "Failed to register asset" }, { status: 500 });
  }
}
