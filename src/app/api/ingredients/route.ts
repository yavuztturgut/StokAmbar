import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("GET Ingredients Error:", error);
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
