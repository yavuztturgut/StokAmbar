import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, stockCountCreateSchema } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const adjustments = await prisma.stockCountAdjustment.findMany({
      where: { accountId: payload.accountId },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json(adjustments);
  } catch (error) {
    console.error("Stock count list error:", error);
    return NextResponse.json({ error: "Sayim kayitlari alinamadi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforcePostAuthRateLimit({ scope: "stock-counts:create", request });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const parsedBody = stockCountCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return withRateLimitHeaders(NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 }), rateLimit);
    }

    const ingredientIds = parsedBody.data.items.map((item) => item.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
      where: {
        accountId: payload.accountId,
        id: { in: ingredientIds },
      },
    });

    if (ingredients.length !== ingredientIds.length) {
      return withRateLimitHeaders(NextResponse.json({ error: "Bazi malzemeler bulunamadi" }, { status: 404 }), rateLimit);
    }

    const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

    const adjusted = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of parsedBody.data.items) {
        const ingredient = ingredientMap.get(item.ingredientId);
        if (!ingredient) {
          throw new Error("Ingredient not found");
        }

        const difference = item.countedStock - ingredient.currentStock;
        if (difference === 0) {
          continue;
        }

        const details = item.note
          ? `Sayim duzeltmesi: ${ingredient.currentStock} -> ${item.countedStock}. Not: ${item.note}`
          : `Sayim duzeltmesi: ${ingredient.currentStock} -> ${item.countedStock}`;

        await tx.stockTransaction.create({
          data: {
            accountId: payload.accountId,
            ingredientId: ingredient.id,
            type: "ADJUSTMENT",
            quantity: Math.abs(difference),
            note: details,
          },
        });

        await tx.ingredient.update({
          where: { id: ingredient.id },
          data: { currentStock: item.countedStock },
        });

        const adjustment = await tx.stockCountAdjustment.create({
          data: {
            accountId: payload.accountId,
            ingredientId: ingredient.id,
            expectedStock: ingredient.currentStock,
            countedStock: item.countedStock,
            difference,
            note: item.note,
          },
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
          },
        });

        await tx.activityLog.create({
          data: {
            action: "ADJUSTMENT",
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: difference,
            details,
            accountId: payload.accountId,
          },
        });

        results.push(adjustment);
      }

      return results;
    });

    return withRateLimitHeaders(NextResponse.json({
      success: true,
      adjustedCount: adjusted.length,
      adjustments: adjusted,
    }), rateLimit);
  } catch (error) {
    console.error("Stock count create error:", error);
    return NextResponse.json({ error: "Sayim kaydi olusturulamadi" }, { status: 500 });
  }
}
