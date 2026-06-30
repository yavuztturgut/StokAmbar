import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, ingredientCreateSchema } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

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

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "ingredients:write",
      request: req,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = ingredientCreateSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const { name, category, sku, supplier, unit, minStockLevel, currentStock } = parsedBody.data;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category: category || null,
        sku: sku || null,
        supplier: supplier || null,
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
        details: `Ilk stok olusturuldu${category ? ` | Kategori: ${category}` : ""}${sku ? ` | SKU: ${sku}` : ""}${supplier ? ` | Tedarikci: ${supplier}` : ""}`,
        accountId: payload.accountId,
      },
    });

    return withRateLimitHeaders(NextResponse.json(ingredient), rateLimit);
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
