import { NextRequest, NextResponse } from "next/server";
import { differenceInCalendarDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";

const DEFAULT_DAYS = 30;
const OVERSTOCK_MULTIPLIER = 3;

type IngredientBase = {
  id: number;
  name: string;
  category: string | null;
  sku: string | null;
  supplier: string | null;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  createdAt: Date;
};

type IdleStockRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  daysWithoutMovement: number;
  lastMovementAt: string | null;
};

type OverstockRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  overstockRatio: number;
  excessAmount: number;
};

type WasteAnomalyRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  totalOut: number;
  totalWaste: number;
  wasteRatio: number | null;
  lastWasteAt: string | null;
  severity: "critical" | "high" | "watch";
};

type CountVarianceRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  unit: string;
  adjustmentCount: number;
  totalAbsoluteDifference: number;
  latestDifference: number;
  lastCountedAt: string | null;
};

type DataQualityRow = {
  ingredientId: number;
  name: string;
  category: string;
  sku: string;
  supplier: string;
  unit: string;
  issues: string[];
};

const parseDateParam = (value: string | null, fallback: Date, boundary: "start" | "end") => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return boundary === "start" ? startOfDay(parsed) : endOfDay(parsed);
};

const textValue = (value: string | null | undefined, fallback = "-") => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const createMovementMap = <T,>(ingredients: IngredientBase[], factory: (ingredient: IngredientBase) => T) =>
  new Map(ingredients.map((ingredient) => [ingredient.id, factory(ingredient)]));

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const url = new URL(req.url);
    const rawSearch = url.searchParams.get("search")?.trim() || "";
    const category = url.searchParams.get("category")?.trim() || "";

    const defaultEnd = endOfDay(new Date());
    const defaultStart = startOfDay(subDays(defaultEnd, DEFAULT_DAYS - 1));
    const startDate = parseDateParam(url.searchParams.get("startDate"), defaultStart, "start");
    const endDate = parseDateParam(url.searchParams.get("endDate"), defaultEnd, "end");

    if (startDate > endDate) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const accountId = payload.accountId;

    const ingredientWhere = {
      accountId,
      ...(category ? { category } : {}),
      ...(rawSearch
        ? {
            OR: [
              { name: { contains: rawSearch } },
              { category: { contains: rawSearch } },
              { sku: { contains: rawSearch } },
              { supplier: { contains: rawSearch } },
            ],
          }
        : {}),
    };

    const [categoriesRaw, ingredients] = await Promise.all([
      prisma.ingredient.findMany({
        where: { accountId, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      }),
      prisma.ingredient.findMany({
        where: ingredientWhere,
        select: {
          id: true,
          name: true,
          category: true,
          sku: true,
          supplier: true,
          unit: true,
          currentStock: true,
          minStockLevel: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const categories = categoriesRaw
      .map((item) => item.category)
      .filter((value): value is string => Boolean(value));

    if (ingredients.length === 0) {
      return NextResponse.json({
        filters: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
          category,
          search: rawSearch,
        },
        categories,
        summary: {
          idleStockCount: 0,
          overstockCount: 0,
          wasteAnomalyCount: 0,
          repeatedCountVarianceCount: 0,
          dataQualityCount: 0,
        },
        reports: {
          idleStock: [],
          overstock: [],
          wasteAnomalies: [],
          repeatedCountVariance: [],
          dataQuality: [],
        },
      });
    }

    const ingredientIds = ingredients.map((ingredient) => ingredient.id);

    const [periodTransactions, allTransactions, adjustments] = await Promise.all([
      prisma.stockTransaction.findMany({
        where: {
          accountId,
          ingredientId: { in: ingredientIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          ingredientId: true,
          type: true,
          quantity: true,
          createdAt: true,
        },
      }),
      prisma.stockTransaction.findMany({
        where: {
          accountId,
          ingredientId: { in: ingredientIds },
        },
        select: {
          ingredientId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.stockCountAdjustment.findMany({
        where: {
          accountId,
          ingredientId: { in: ingredientIds },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          ingredientId: true,
          difference: true,
          createdAt: true,
        },
      }),
    ]);

    const lastMovementByIngredient = new Map<number, Date>();
    allTransactions.forEach((transaction) => {
      if (!lastMovementByIngredient.has(transaction.ingredientId)) {
        lastMovementByIngredient.set(transaction.ingredientId, transaction.createdAt);
      }
    });

    const periodMovement = createMovementMap(ingredients, () => ({
      totalOut: 0,
      totalWaste: 0,
      lastWasteAt: null as string | null,
    }));

    periodTransactions.forEach((transaction) => {
      const record = periodMovement.get(transaction.ingredientId);
      if (!record) {
        return;
      }

      const quantity = Math.abs(transaction.quantity);

      if (transaction.type === "OUT") {
        record.totalOut += quantity;
      }

      if (transaction.type === "WASTE") {
        record.totalWaste += quantity;
        record.lastWasteAt = transaction.createdAt.toISOString();
      }
    });

    const countVarianceMap = createMovementMap(ingredients, () => ({
      adjustmentCount: 0,
      totalAbsoluteDifference: 0,
      latestDifference: 0,
      lastCountedAt: null as string | null,
    }));

    adjustments.forEach((adjustment) => {
      const record = countVarianceMap.get(adjustment.ingredientId);
      if (!record) {
        return;
      }

      record.adjustmentCount += 1;
      record.totalAbsoluteDifference += Math.abs(adjustment.difference);
      record.latestDifference = adjustment.difference;
      record.lastCountedAt = adjustment.createdAt.toISOString();
    });

    const idleStock: IdleStockRow[] = ingredients
      .map((ingredient) => {
        const lastMovementAt = lastMovementByIngredient.get(ingredient.id) || null;
        const daysWithoutMovement = lastMovementAt
          ? differenceInCalendarDays(endDate, lastMovementAt)
          : differenceInCalendarDays(endDate, ingredient.createdAt);

        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: textValue(ingredient.category),
          sku: textValue(ingredient.sku),
          unit: ingredient.unit,
          currentStock: ingredient.currentStock,
          minStockLevel: ingredient.minStockLevel,
          daysWithoutMovement,
          lastMovementAt: lastMovementAt?.toISOString() || null,
        };
      })
      .filter((item) => item.daysWithoutMovement >= DEFAULT_DAYS)
      .sort((left, right) => right.daysWithoutMovement - left.daysWithoutMovement);

    const overstock: OverstockRow[] = ingredients
      .filter((ingredient) => ingredient.minStockLevel > 0 && ingredient.currentStock >= ingredient.minStockLevel * OVERSTOCK_MULTIPLIER)
      .map((ingredient) => ({
        ingredientId: ingredient.id,
        name: ingredient.name,
        category: textValue(ingredient.category),
        sku: textValue(ingredient.sku),
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
        minStockLevel: ingredient.minStockLevel,
        overstockRatio: ingredient.currentStock / ingredient.minStockLevel,
        excessAmount: ingredient.currentStock - ingredient.minStockLevel * OVERSTOCK_MULTIPLIER,
      }))
      .sort((left, right) => right.overstockRatio - left.overstockRatio);

    const wasteAnomalies: WasteAnomalyRow[] = ingredients
      .map((ingredient) => {
        const movement = periodMovement.get(ingredient.id);
        const totalOut = movement?.totalOut || 0;
        const totalWaste = movement?.totalWaste || 0;

        if (totalOut === 0 && totalWaste === 0) {
          return null;
        }

        const wasteRatio = totalOut > 0 ? totalWaste / totalOut : null;
        let severity: WasteAnomalyRow["severity"] = "watch";

        if (totalOut === 0 && totalWaste > 0) {
          severity = "critical";
        } else if ((wasteRatio ?? 0) >= 0.5 || totalWaste >= 10) {
          severity = "critical";
        } else if ((wasteRatio ?? 0) >= 0.25 || totalWaste >= 5) {
          severity = "high";
        }

        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: textValue(ingredient.category),
          sku: textValue(ingredient.sku),
          unit: ingredient.unit,
          totalOut,
          totalWaste,
          wasteRatio,
          lastWasteAt: movement?.lastWasteAt || null,
          severity,
        };
      })
      .filter((item): item is WasteAnomalyRow => Boolean(item))
      .filter((item) => item.totalWaste > 0)
      .sort((left, right) => {
        const leftScore = left.wasteRatio ?? Number.POSITIVE_INFINITY;
        const rightScore = right.wasteRatio ?? Number.POSITIVE_INFINITY;
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }
        return right.totalWaste - left.totalWaste;
      });

    const repeatedCountVariance: CountVarianceRow[] = ingredients
      .map((ingredient) => {
        const record = countVarianceMap.get(ingredient.id);
        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: textValue(ingredient.category),
          sku: textValue(ingredient.sku),
          unit: ingredient.unit,
          adjustmentCount: record?.adjustmentCount || 0,
          totalAbsoluteDifference: record?.totalAbsoluteDifference || 0,
          latestDifference: record?.latestDifference || 0,
          lastCountedAt: record?.lastCountedAt || null,
        };
      })
      .filter((item) => item.adjustmentCount > 0)
      .sort((left, right) => {
        if (right.adjustmentCount !== left.adjustmentCount) {
          return right.adjustmentCount - left.adjustmentCount;
        }
        return right.totalAbsoluteDifference - left.totalAbsoluteDifference;
      });

    const dataQuality: DataQualityRow[] = ingredients
      .map((ingredient) => {
        const issues: string[] = [];

        if (!ingredient.sku?.trim()) {
          issues.push("SKU eksik");
        }

        if (!ingredient.category?.trim()) {
          issues.push("Kategori eksik");
        }

        if (!ingredient.supplier?.trim()) {
          issues.push("Tedarikci eksik");
        }

        if (ingredient.minStockLevel <= 0) {
          issues.push("Min stok tanimsiz");
        }

        if (issues.length === 0) {
          return null;
        }

        return {
          ingredientId: ingredient.id,
          name: ingredient.name,
          category: textValue(ingredient.category),
          sku: textValue(ingredient.sku),
          supplier: textValue(ingredient.supplier),
          unit: ingredient.unit,
          issues,
        };
      })
      .filter((item): item is DataQualityRow => Boolean(item))
      .sort((left, right) => right.issues.length - left.issues.length);

    return NextResponse.json({
      filters: {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        category,
        search: rawSearch,
      },
      categories,
      summary: {
        idleStockCount: idleStock.length,
        overstockCount: overstock.length,
        wasteAnomalyCount: wasteAnomalies.length,
        repeatedCountVarianceCount: repeatedCountVariance.length,
        dataQualityCount: dataQuality.length,
      },
      reports: {
        idleStock,
        overstock,
        wasteAnomalies,
        repeatedCountVariance,
        dataQuality,
      },
    });
  } catch (error) {
    console.error("Reports Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
