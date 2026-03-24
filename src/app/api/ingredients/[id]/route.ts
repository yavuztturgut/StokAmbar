import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { name, minStockLevel, unit } = body;

    // Kaynağı check et - kullanıcı bu kaynağı kullanabilir mi?
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
        minStockLevel: parseFloat(minStockLevel),
      },
    });

    // Activity Log
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
    } catch (e) {
      console.error("Log error (Update):", e);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });

    if (!ingredient) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (ingredient.accountId !== payload.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Activity Log - FIRST, so we have the info
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
    } catch (e) {
      console.error("Log error (Delete):", e);
    }

    // Explicitly delete transactions
    await prisma.stockTransaction.deleteMany({
      where: { ingredientId: id },
    });

    await prisma.ingredient.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed", details: error.message }, { status: 500 });
  }
}
