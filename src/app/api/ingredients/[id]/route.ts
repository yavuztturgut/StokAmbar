import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, ingredientUpdateSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id: idStr } = await params;
    const id = Number.parseInt(idStr, 10);
    const parsedBody = ingredientUpdateSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const { name, minStockLevel, unit } = parsedBody.data;

    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient || ingredient.accountId !== payload.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
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
          details: `Ad: ${name}, Birim: ${unit}, Min: ${minStockLevel}`,
          accountId: payload.accountId,
        },
      });
    } catch (error) {
      console.error("Log error (Update):", error);
    }

    return NextResponse.json(updated);
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

    const { id: idStr } = await params;
    const id = Number.parseInt(idStr, 10);

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });

    if (!ingredient) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (ingredient.accountId !== payload.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    return NextResponse.json({ success: true });
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
