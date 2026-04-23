import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { sendLowStockEmail } from "@/lib/email";

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

      // Fetch users belonging to this account to send them emails
      const users = await tx.user.findMany({
        where: { accountId: payload.accountId },
        select: { email: true }
      });

      if (!current || users.length === 0) {
        throw new Error("Ingredient or Users not found");
      }

      const userEmails = users.map(u => u.email).filter(Boolean).join(", ");

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

      const emailNeeded = (type === "OUT" || type === "WASTE") && current.currentStock > current.minStockLevel && newStock <= current.minStockLevel;
      console.log(`[Email Debug] type: ${type}, oldStock: ${current.currentStock}, newStock: ${newStock}, min: ${current.minStockLevel}, needed: ${emailNeeded}`);

      return { 
        transaction, 
        updatedIngredient,
        targetEmails: userEmails,
        emailNeeded
      };
    });

    console.log(`[Email Debug] Outside transaction. emailNeeded=${result.emailNeeded}, targetEmails=${result.targetEmails}`);
    if (result.emailNeeded && result.targetEmails) {
      console.log(`[Email Debug] Dispatching email to ${result.targetEmails}`);
      // Background email dispatch
      sendLowStockEmail(
        result.targetEmails,
        result.updatedIngredient.name,
        result.updatedIngredient.currentStock,
        result.updatedIngredient.minStockLevel,
        result.updatedIngredient.unit
      ).then(() => console.log("[Email Debug] sendLowStockEmail function completed its block"))
       .catch(err => console.error("[Email API Error]:", err));
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Transaction Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const statusCode = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: "Failed to process movement", details: message }, { status: statusCode });
  }
}
