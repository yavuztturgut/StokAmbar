import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { startOfDay, subDays, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (payload instanceof NextResponse) return payload;

    const accountId = payload.accountId;

    // 1. Stock Status Summary
    const ingredients = await prisma.ingredient.findMany({
      where: { accountId },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
        unit: true,
      },
    });

    const totalItems = ingredients.length;
    const criticalItems = ingredients.filter(
      (i) => i.currentStock <= i.minStockLevel
    );
    const criticalCount = criticalItems.length;

    // 2. Consumption Trend (Last 7 Days)
    const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
    
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        accountId,
        type: { in: ["OUT", "WASTE"] },
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        ingredient: {
          select: { name: true, unit: true }
        }
      }
    });

    // Group transactions by date
    const dailyConsumption: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const dateStr = subDays(new Date(), i).toISOString().split('T')[0];
      dailyConsumption[dateStr] = 0;
    }

    transactions.forEach(t => {
      const dateStr = t.createdAt.toISOString().split('T')[0];
      if (dailyConsumption[dateStr] !== undefined) {
        dailyConsumption[dateStr] += t.quantity;
      }
    });

    const trendData = Object.entries(dailyConsumption)
      .map(([date, amount]) => ({
        date: date.split('-').slice(1).join('/'), // MM/DD format
        amount
      }))
      .reverse();

    // 3. Top Consumed Items (Last 30 Days)
    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const topTransactions = await prisma.stockTransaction.groupBy({
      by: ['ingredientId'],
      where: {
        accountId,
        type: { in: ["OUT", "WASTE"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const topMovingItems = await Promise.all(
      topTransactions.map(async (t) => {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: t.ingredientId },
          select: { name: true, unit: true }
        });
        return {
          name: ingredient?.name || "Bilinmiyor",
          amount: t._sum.quantity || 0,
          unit: ingredient?.unit || ""
        };
      })
    );

    // 4. Distribution Data (Current Stock vs Min for critical or all)
    const distributionData = ingredients
      .slice(0, 8) // Limit to avoid clutter
      .map(i => ({
        name: i.name,
        current: i.currentStock,
        min: i.minStockLevel
      }));

    return NextResponse.json({
      summary: {
        totalItems,
        criticalCount,
        normalCount: totalItems - criticalCount,
        topMovingItem: topMovingItems[0]?.name || "N/A"
      },
      trend: trendData,
      topMoving: topMovingItems,
      distribution: distributionData
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
