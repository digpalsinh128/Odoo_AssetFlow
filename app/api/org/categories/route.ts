export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";


export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.assetCategory.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET categories error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, fields } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.assetCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const newCategory = await prisma.assetCategory.create({
      data: {
        name,
        fields: fields ? JSON.stringify(fields) : null,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("POST categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, fields } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    const existing = await prisma.assetCategory.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const updatedCategory = await prisma.assetCategory.update({
      where: { id },
      data: {
        name,
        fields: fields ? JSON.stringify(fields) : null,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("PUT categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
