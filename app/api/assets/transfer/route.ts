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

    const transferRequests = await prisma.transferRequest.findMany({
      include: {
        allocation: {
          include: {
            asset: true,
            user: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
        requestedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transferRequests);
  } catch (error: any) {
    console.error("GET transfer error:", error);
    return NextResponse.json({ error: "Failed to fetch transfer requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user as any;
    const body = await req.json();
    const { action, requestId, allocationId, targetUserId, targetDepartmentId } = body;

    if (action === "request") {
      if (!allocationId) {
        return NextResponse.json({ error: "Allocation ID is required" }, { status: 400 });
      }

      if (!targetUserId && !targetDepartmentId) {
        return NextResponse.json({ error: "Please specify a target User or Department" }, { status: 400 });
      }

      const activeAllocation = await prisma.allocation.findUnique({
        where: { id: allocationId },
        include: { asset: true },
      });

      if (!activeAllocation || activeAllocation.status !== "ACTIVE") {
        return NextResponse.json({ error: "Active allocation not found" }, { status: 404 });
      }

      const request = await prisma.transferRequest.create({
        data: {
          allocationId,
          targetUserId: targetUserId || null,
          targetDepartmentId: targetDepartmentId || null,
          status: "PENDING",
          requestedById: currentUser.id,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "REQUEST_TRANSFER",
          details: `Transfer requested for Asset "${activeAllocation.asset.name}" (S/N: ${activeAllocation.asset.serialNumber}) by ${currentUser.name}`,
          userId: currentUser.id,
        },
      });

      return NextResponse.json(request, { status: 201 });
    }

    if (action === "approve" || action === "reject") {
      if (!requestId) {
        return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
      }

      // Check permission: Admin, Asset Manager, or Department Head
      if (!["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(currentUser.role)) {
        return NextResponse.json({ error: "Insufficient permissions to process request" }, { status: 403 });
      }

      const request = await prisma.transferRequest.findUnique({
        where: { id: requestId },
        include: {
          allocation: { include: { asset: true } },
          requestedBy: true,
        },
      });

      if (!request || request.status !== "PENDING") {
        return NextResponse.json({ error: "Pending transfer request not found" }, { status: 404 });
      }

      if (action === "reject") {
        const updated = await prisma.transferRequest.update({
          where: { id: requestId },
          data: { status: "REJECTED" },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            action: "REJECT_TRANSFER",
            details: `Transfer request for Asset "${request.allocation.asset.name}" (S/N: ${request.allocation.asset.serialNumber}) rejected by ${currentUser.name}`,
            userId: currentUser.id,
          },
        });

        return NextResponse.json(updated);
      }

      if (action === "approve") {
        // Update TransferRequest status to APPROVED
        const updatedRequest = await prisma.transferRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            approvedById: currentUser.id,
          },
        });

        // Update active allocation target
        await prisma.allocation.update({
          where: { id: request.allocationId },
          data: {
            userId: request.targetUserId || null,
            departmentId: request.targetDepartmentId || null,
          },
        });

        // Find target name for logging
        let targetName = "";
        if (request.targetUserId) {
          const u = await prisma.user.findUnique({ where: { id: request.targetUserId } });
          if (u) targetName = `User: ${u.name}`;
        } else if (request.targetDepartmentId) {
          const d = await prisma.department.findUnique({ where: { id: request.targetDepartmentId } });
          if (d) targetName = `Department: ${d.name}`;
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            action: "APPROVE_TRANSFER",
            details: `Transfer of Asset "${request.allocation.asset.name}" (S/N: ${request.allocation.asset.serialNumber}) to ${targetName} approved by ${currentUser.name}`,
            userId: currentUser.id,
          },
        });

        return NextResponse.json(updatedRequest);
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST transfer error:", error);
    return NextResponse.json({ error: "Failed to process transfer request" }, { status: 500 });
  }
}
