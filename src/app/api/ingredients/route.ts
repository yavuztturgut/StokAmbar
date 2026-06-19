import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, ingredientCreateSchema } from "@/lib/validation";

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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("GET Ingredients Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingredients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const parsedBody = ingredientCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const { name, unit, minStockLevel, currentStock } = parsedBody.data;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        minStockLevel,
        currentStock,
        accountId: payload.accountId,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "CREATE",
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: ingredient.currentStock,
        details: "Ilk stok olusturuldu",
        accountId: payload.accountId,
      },
    });

    return NextResponse.json(ingredient);
  } catch (error: unknown) {
    console.error("POST Ingredient Error Detailed:", error);
    return NextResponse.json(
      {
        error: "Failed to create ingredient",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
