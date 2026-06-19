import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { startOfDay, subDays } from "date-fns";
import { analyticsQuerySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (payload instanceof NextResponse) return payload;

    const accountId = payload.accountId;

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
      (ingredient) => ingredient.currentStock <= ingredient.minStockLevel
    );
    const criticalCount = criticalItems.length;

    const url = new URL(req.url);
    const parsedQuery = analyticsQuerySchema.safeParse({
      days: url.searchParams.get("days") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });
    }

    const { days: trendDays } = parsedQuery.data;
    const trendStartDate = startOfDay(subDays(new Date(), trendDays - 1));

    const transactions = await prisma.stockTransaction.findMany({
      where: {
        accountId,
        type: { in: ["OUT", "WASTE"] },
        createdAt: { gte: trendStartDate },
      },
      include: {
        ingredient: {
          select: { name: true, unit: true },
        },
      },
    });

    const dailyConsumption: Record<string, number> = {};
    for (let index = 0; index < trendDays; index += 1) {
      const dateStr = subDays(new Date(), index).toISOString().split("T")[0];
      dailyConsumption[dateStr] = 0;
    }

    transactions.forEach((transaction) => {
      const dateStr = transaction.createdAt.toISOString().split("T")[0];
      if (dailyConsumption[dateStr] !== undefined) {
        dailyConsumption[dateStr] += transaction.quantity;
      }
    });

    const trendData = Object.entries(dailyConsumption)
      .map(([date, amount]) => {
        const [, month, day] = date.split("-");
        return {
          date: `${day}.${month}`,
          amount,
        };
      })
      .reverse();

    const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
    const topTransactions = await prisma.stockTransaction.groupBy({
      by: ["ingredientId"],
      where: {
        accountId,
        type: { in: ["OUT", "WASTE"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topMovingItems = await Promise.all(
      topTransactions.map(async (transaction) => {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: transaction.ingredientId },
          select: { name: true, unit: true },
        });
        return {
          name: ingredient?.name || "Bilinmiyor",
          amount: transaction._sum.quantity || 0,
          unit: ingredient?.unit || "",
        };
      })
    );

    const distributionData = ingredients.slice(0, 8).map((ingredient) => ({
      name: ingredient.name,
      current: ingredient.currentStock,
      min: ingredient.minStockLevel,
    }));

    return NextResponse.json({
      summary: {
        totalItems,
        criticalCount,
        normalCount: totalItems - criticalCount,
        topMovingItem: topMovingItems[0]?.name || "Hareket yok",
      },
      trend: trendData,
      topMoving: topMovingItems,
      distribution: distributionData,
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
