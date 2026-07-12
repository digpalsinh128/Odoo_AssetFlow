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

    const departments = await prisma.department.findMany({
      include: {
        parent: true,
        manager: true,
      },
    });

    const users = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ departments, users });
  } catch (error: any) {
    console.error("GET departments error:", error);
    return NextResponse.json({ error: "Failed to fetch departments data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, parentId, managerId, status } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (managerId) {
      // Disconnect the manager from any existing department they manage
      const existingManaged = await prisma.department.findUnique({
        where: { managerId },
      });
      if (existingManaged) {
        await prisma.department.update({
          where: { id: existingManaged.id },
          data: { managerId: null },
        });
      }

      // Promote the manager to DEPARTMENT_HEAD
      await prisma.user.update({
        where: { id: managerId },
        data: { role: "DEPARTMENT_HEAD" },
      });
    }

    const newDept = await prisma.department.create({
      data: {
        name,
        parentId: parentId || null,
        managerId: managerId || null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    console.error("POST departments error:", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, parentId, managerId, status } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    if (managerId) {
      // Disconnect manager from any other department they manage
      const existingManaged = await prisma.department.findUnique({
        where: { managerId },
      });
      if (existingManaged && existingManaged.id !== id) {
        await prisma.department.update({
          where: { id: existingManaged.id },
          data: { managerId: null },
        });
      }

      // Promote the manager to DEPARTMENT_HEAD
      await prisma.user.update({
        where: { id: managerId },
        data: { role: "DEPARTMENT_HEAD" },
      });
    }

    const updatedDept = await prisma.department.update({
      where: { id },
      data: {
        name,
        parentId: parentId || null,
        managerId: managerId || null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(updatedDept);
  } catch (error: any) {
    console.error("PUT departments error:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}
