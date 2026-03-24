import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { name, minStockLevel, unit } = body;

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Activity Log - FIRST, so we have the info
    try {
      await prisma.activityLog.create({
        data: {
          action: "DELETE",
          ingredientId: null,
          ingredientName: ingredient.name,
          details: "Malzeme tamamen silindi",
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
