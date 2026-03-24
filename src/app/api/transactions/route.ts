import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const body = await req.json();
    const { ingredientId: idRaw, type, quantity, note } = body;
    const ingredientId = parseInt(idRaw);

    if (!ingredientId || !type || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Atomic transaction: Create movement record AND update ingredient stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current ingredient and check stock
      const current = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!current) {
        throw new Error("Ingredient not found");
      }

      // Check authorization
      if (current.accountId !== payload.accountId) {
        throw new Error("Unauthorized");
      }

      // Calculate new stock level
      // IN increases stock, OUT and WASTE decrease it
      const multiplier = type === "IN" ? 1 : -1;
      const stockChange = parseFloat(quantity) * multiplier;
      const newStock = current.currentStock + stockChange;

      // Prevent negative stock
      if (newStock < 0) {
        throw new Error("Yetersiz stok! Stok miktarı sıfırın altına düşemez.");
      }

      // 2. Create the transaction record
      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId,
          type,
          quantity: parseFloat(quantity),
          note,
          accountId: payload.accountId,
        },
      });

      // 3. Update ingredient stock
      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: newStock,
        },
      });

      // 4. Add Activity Log
      await tx.activityLog.create({
        data: {
          action: type, // IN, OUT, WASTE
          ingredientId,
          ingredientName: updatedIngredient.name,
          quantity: parseFloat(quantity),
          details: note || `${type} işlemi yapıldı`,
          accountId: payload.accountId,
        },
      });

      return { transaction, updatedIngredient };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Transaction Error:", error);
    const statusCode = error.message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: "Failed to process movement", details: error.message }, { status: statusCode });
  }
}
