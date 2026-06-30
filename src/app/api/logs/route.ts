import { NextResponse, NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, logsQuerySchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const payload = await requireAuth(req);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const isAll = limitParam === "all";
    const parsedQuery = logsQuerySchema.safeParse({
      limit: isAll ? undefined : limitParam ?? undefined,
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      amountDirection: searchParams.get("amountDirection") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: formatZodError(parsedQuery.error) },
        { status: 400 }
      );
    }

    const {
      limit = 20,
      page,
      search,
      action,
      startDate,
      endDate,
      amountDirection,
      sort,
    } = parsedQuery.data;

    const skip = isAll ? undefined : (page - 1) * limit;
    const take = isAll ? undefined : limit;

    const where: Prisma.ActivityLogWhereInput = {
      accountId: payload.accountId,
    };

    if (search) {
      where.ingredientName = { contains: search };
    }

    if (action !== "ALL") {
      where.action = action;
    }

    if (amountDirection === "INCREASE") {
      where.OR = [
        { action: { in: ["CREATE", "IN"] } },
        { action: "ADJUSTMENT", quantity: { gt: 0 } },
      ];
    }

    if (amountDirection === "DECREASE") {
      where.OR = [
        { action: { in: ["OUT", "WASTE"] } },
        { action: "ADJUSTMENT", quantity: { lt: 0 } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(`${startDate}T00:00:00.000`);
      }

      if (endDate) {
        where.createdAt.lte = new Date(`${endDate}T23:59:59.999`);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
        skip,
        take,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: isAll ? 1 : Math.max(1, Math.ceil(total / limit)),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
