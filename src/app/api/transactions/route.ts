import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredientId, type, quantity, note } = body;

    if (!ingredientId || !type || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Atomic transaction: Create movement record AND update ingredient stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId,
          type,
          quantity: parseFloat(quantity),
          note,
        },
      });

      // 2. Calculate new stock level
      // IN increases stock, OUT and WASTE decrease it
      const multiplier = type === "IN" ? 1 : -1;
      const stockChange = parseFloat(quantity) * multiplier;

      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: {
            increment: stockChange,
          },
        },
      });

      // 3. Add Activity Log
      await tx.activityLog.create({
        data: {
          action: type, // IN, OUT, WASTE
          ingredientId,
          ingredientName: updatedIngredient.name,
          quantity: parseFloat(quantity),
          details: note || `${type} işlemi yapıldı`,
        },
      });

      return { transaction, updatedIngredient };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: "Failed to process movement", details: error.message }, { status: 500 });
  }
}
