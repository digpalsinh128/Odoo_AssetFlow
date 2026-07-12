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

    const currentUser = session.user as any;
    const userId = currentUser.id;
    const role = currentUser.role;

    const now = new Date();

    if (role === "ADMIN" || role === "ASSET_MANAGER") {
      // Admin sees global workspace stats
      const totalAssets = await prisma.asset.count();
      const allocatedAssets = await prisma.asset.count({
        where: { status: "ALLOCATED" },
      });
      const maintenanceAssets = await prisma.asset.count({
        where: { status: "UNDER_MAINTENANCE" },
      });
      const overdueAllocationsCount = await prisma.allocation.count({
        where: {
          status: "ACTIVE",
          expectedReturnDate: { lt: now },
        },
      });

      const overdueList = await prisma.allocation.findMany({
        where: {
          status: "ACTIVE",
          expectedReturnDate: { lt: now },
        },
        include: {
          asset: true,
          user: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      const activityLogs = await prisma.activityLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      return NextResponse.json({
        kpis: {
          totalAssets,
          allocatedAssets,
          maintenanceAssets,
          overdueAssets: overdueAllocationsCount,
        },
        overdueList,
        activityLogs,
      });
    } else {
      // Employee / Department Head sees their own metrics
      const userAllocations = await prisma.allocation.findMany({
        where: {
          userId,
          status: "ACTIVE",
        },
        include: {
          asset: true,
        },
      });

      const totalAssets = userAllocations.length;
      const allocatedAssets = userAllocations.filter((a) => a.asset.status === "ALLOCATED").length;
      const maintenanceAssets = userAllocations.filter((a) => a.asset.status === "UNDER_MAINTENANCE").length;

      const overdueAllocations = await prisma.allocation.findMany({
        where: {
          userId,
          status: "ACTIVE",
          expectedReturnDate: { lt: now },
        },
        include: {
          asset: true,
          user: { select: { id: true, name: true } },
        },
      });

      const activityLogs = await prisma.activityLog.findMany({
        where: {
          userId,
        },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        kpis: {
          totalAssets,
          allocatedAssets,
          maintenanceAssets,
          overdueAssets: overdueAllocations.length,
        },
        overdueList: overdueAllocations,
        activityLogs,
      });
    }
  } catch (error: any) {
    console.error("GET dashboard metrics error:", error);
    return NextResponse.json({ error: "Failed to compile dashboard metrics" }, { status: 500 });
  }
}
