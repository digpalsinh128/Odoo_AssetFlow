import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        assets: {
          include: {
            maintenance: true
          }
        }
      }
    });

    const reportData = categories.map(category => {
      let totalRequests = 0;
      let resolvedCount = 0;
      let totalResolutionTimeMs = 0;

      category.assets.forEach(asset => {
        totalRequests += asset.maintenance.length;
        
        asset.maintenance.forEach(req => {
          if (req.status === 'RESOLVED' && req.resolvedAt) {
            resolvedCount++;
            const diff = new Date(req.resolvedAt).getTime() - new Date(req.createdAt).getTime();
            totalResolutionTimeMs += diff;
          }
        });
      });

      const avgResolutionTimeHours = resolvedCount > 0 
        ? (totalResolutionTimeMs / resolvedCount) / (1000 * 60 * 60)
        : 0;

      return {
        categoryName: category.name,
        totalRequests,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10 // 1 decimal place
      };
    });

    // Sort by total requests descending
    reportData.sort((a, b) => b.totalRequests - a.totalRequests);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating maintenance report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
