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

    const employees = await prisma.user.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    });

    // Fetch active departments for select dropdown in directory editor
    const departments = await prisma.department.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });

    return NextResponse.json({ employees, departments });
  } catch (error: any) {
    console.error("GET employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, role, status, departmentId } = body;

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role || undefined,
        status: status || undefined,
        departmentId: departmentId === undefined ? undefined : (departmentId || null),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("PUT employees error:", error);
    return NextResponse.json({ error: "Failed to update employee details" }, { status: 500 });
  }
}
