import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, ingredientUpdateSchema } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "ingredients:write",
      request: req,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const { id: idStr } = await params;
    const id = Number.parseInt(idStr, 10);
    const parsedBody = ingredientUpdateSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const { name, category, sku, supplier, minStockLevel, unit } = parsedBody.data;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient || ingredient.accountId !== payload.accountId) {
      return respond({ error: "Unauthorized" }, 403);
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        category: category || null,
        sku: sku || null,
        supplier: supplier || null,
        unit,
        minStockLevel,
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: "UPDATE",
          ingredientId: id,
          ingredientName: updated.name,
          details: `Ad: ${name}, Kategori: ${category || "-"}, SKU: ${sku || "-"}, Tedarikci: ${supplier || "-"}, Birim: ${unit}, Min: ${minStockLevel}`,
          accountId: payload.accountId,
        },
      });
    } catch (error) {
      console.error("Log error (Update):", error);
    }

    return withRateLimitHeaders(NextResponse.json(updated), rateLimit);
  } catch (error: unknown) {
    console.error("Update Error:", error);
    return NextResponse.json(
      {
        error: "Update failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "ingredients:write",
      request: req,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const { id: idStr } = await params;
    const id = Number.parseInt(idStr, 10);

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });

    if (!ingredient) {
      return respond({ error: "Not found" }, 404);
    }

    if (ingredient.accountId !== payload.accountId) {
      return respond({ error: "Unauthorized" }, 403);
    }

    try {
      await prisma.activityLog.create({
        data: {
          action: "DELETE",
          ingredientId: null,
          ingredientName: ingredient.name,
          details: "Malzeme tamamen silindi",
          accountId: payload.accountId,
        },
      });
    } catch (error) {
      console.error("Log error (Delete):", error);
    }

    await prisma.stockTransaction.deleteMany({
      where: { ingredientId: id },
    });

    await prisma.ingredient.delete({
      where: { id },
    });

    return withRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
  } catch (error: unknown) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      {
        error: "Delete failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
