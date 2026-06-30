import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { sendLowStockEmail } from "@/lib/email";
import { formatZodError, transactionSchema } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await enforcePostAuthRateLimit({ scope: "transactions:create", request: req });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const parsedBody = transactionSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return withRateLimitHeaders(NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      ), rateLimit);
    }

    const { ingredientId, type, quantity, note } = parsedBody.data;

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });

      const users = await tx.user.findMany({
        where: { accountId: payload.accountId },
        select: { email: true },
      });

      if (!current || users.length === 0) {
        throw new Error("Ingredient or Users not found");
      }

      const userEmails = users.map((user) => user.email).filter(Boolean).join(", ");

      if (current.accountId !== payload.accountId) {
        throw new Error("Unauthorized");
      }

      const multiplier = type === "IN" ? 1 : -1;
      const stockChange = quantity * multiplier;
      const newStock = current.currentStock + stockChange;

      if (newStock < 0) {
        throw new Error("Yetersiz stok. Stok miktari sifirin altina dusemez.");
      }

      const transaction = await tx.stockTransaction.create({
        data: {
          ingredientId,
          type,
          quantity,
          note,
          accountId: payload.accountId,
        },
      });

      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: newStock,
        },
      });

      await tx.activityLog.create({
        data: {
          action: type,
          ingredientId,
          ingredientName: updatedIngredient.name,
          quantity,
          details: note || `${type} islemi yapildi`,
          accountId: payload.accountId,
        },
      });

      const emailNeeded =
        (type === "OUT" || type === "WASTE") &&
        current.currentStock > current.minStockLevel &&
        newStock <= current.minStockLevel;

      return {
        transaction,
        updatedIngredient,
        targetEmails: userEmails,
        emailNeeded,
      };
    });

    if (result.emailNeeded && result.targetEmails) {
      sendLowStockEmail(
        result.targetEmails,
        result.updatedIngredient.name,
        result.updatedIngredient.currentStock,
        result.updatedIngredient.minStockLevel,
        result.updatedIngredient.unit
      ).catch((error) => console.error("[Email API Error]:", error));
    }

    return withRateLimitHeaders(NextResponse.json(result), rateLimit);
  } catch (error: unknown) {
    console.error("Transaction Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const statusCode = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json(
      { error: "Failed to process movement", details: message },
      { status: statusCode }
    );
  }
}
