import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const ingredients = await prisma.ingredient.findMany({
      where: {
        accountId: payload.accountId,
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("GET Ingredients Error:", error);
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const body = await req.json();
    const { name, unit, minStockLevel, currentStock } = body;

    if (!name || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Creating ingredient with data:", { name, unit, minStockLevel, currentStock });

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        minStockLevel: parseFloat(minStockLevel) || 0,
        currentStock: parseFloat(currentStock) || 0,
        accountId: payload.accountId,
      },
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: ingredient.currentStock,
        details: "İlk stok oluşturuldu",
        accountId: payload.accountId,
      },
    });

    return NextResponse.json(ingredient);
  } catch (error: any) {
    console.error("POST Ingredient Error Detailed:", error);
    return NextResponse.json({ 
      error: "Failed to create ingredient", 
      details: error.message || "Unknown error" 
    }, { status: 500 });
  }
}
