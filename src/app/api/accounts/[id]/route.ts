import { NextRequest, NextResponse } from "next/server";
import { createAuthSuccessResponse, loadAuthUser, serializeAccount } from "@/lib/accountAuth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { accountUpdateSchema, formatZodError } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "accounts:write",
      request,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const { id } = await context.params;
    const accountId = Number(id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return respond({ error: "Gecerli bir sirket secin" }, 400);
    }

    const parsedBody = accountUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const current = await prisma.account.findFirst({
      where: { id: accountId, ownerId: payload.userId },
    });
    if (!current) {
      return respond({ error: "Sirket bulunamadi" }, 404);
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
        ...(parsedBody.data.email !== undefined ? { email: parsedBody.data.email } : {}),
        ...(parsedBody.data.phone !== undefined ? { phone: parsedBody.data.phone || null } : {}),
      },
    });

    return withRateLimitHeaders(NextResponse.json({ success: true, account: serializeAccount(updated) }), rateLimit);
  } catch (error) {
    console.error("Sirket guncelleme hatasi:", error);
    return NextResponse.json({ error: "Sirket guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "accounts:write",
      request,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const { id } = await context.params;
    const accountId = Number(id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return respond({ error: "Gecerli bir sirket secin" }, 400);
    }

    const accounts = await prisma.account.findMany({
      where: { ownerId: payload.userId },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (accounts.length <= 1) {
      return respond({ error: "Son kalan sirket silinemez" }, 409);
    }

    const current = accounts.find((item) => item.id === accountId);
    if (!current) {
      return respond({ error: "Sirket bulunamadi" }, 404);
    }

    const nextActiveId = payload.accountId === accountId
      ? accounts.find((item) => item.id !== accountId)?.id
      : payload.accountId;

    await prisma.user.update({
      where: { id: payload.userId },
      data: { accountId: nextActiveId },
    });

    await prisma.account.delete({ where: { id: accountId } });

    const user = await loadAuthUser({ id: payload.userId });
    if (!user || !nextActiveId) {
      return withRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
    }

    return withRateLimitHeaders(createAuthSuccessResponse(user, nextActiveId, "1d"), rateLimit);
  } catch (error) {
    console.error("Sirket silme hatasi:", error);
    return NextResponse.json({ error: "Sirket silinemedi" }, { status: 500 });
  }
}
