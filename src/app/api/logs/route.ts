import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit") || "20";
    const isAll = limitParam === "all";
    const limit = isAll ? 0 : parseInt(limitParam);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";

    const skip = isAll ? undefined : (page - 1) * limit;
    const take = isAll ? undefined : limit;

    const where: Prisma.ActivityLogWhereInput = {
      accountId: payload.accountId,
    };
    if (search) {
      where.ingredientName = { contains: search };
    }
    if (action && action !== "ALL") {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error("Fetch logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
