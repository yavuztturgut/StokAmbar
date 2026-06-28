import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";
import { buildAuthResponse, loadAuthUser, serializeAccount } from "@/lib/accountAuth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { accountUpdateSchema, formatZodError } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id } = await context.params;
    const accountId = Number(id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return NextResponse.json({ error: "Gecerli bir sirket secin" }, { status: 400 });
    }

    const parsedBody = accountUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 });
    }

    const current = await prisma.account.findFirst({
      where: { id: accountId, ownerId: payload.userId },
    });
    if (!current) {
      return NextResponse.json({ error: "Sirket bulunamadi" }, { status: 404 });
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: {
        ...(parsedBody.data.name !== undefined ? { name: parsedBody.data.name } : {}),
        ...(parsedBody.data.email !== undefined ? { email: parsedBody.data.email } : {}),
        ...(parsedBody.data.phone !== undefined ? { phone: parsedBody.data.phone || null } : {}),
      },
    });

    return NextResponse.json({ success: true, account: serializeAccount(updated) });
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

    const { id } = await context.params;
    const accountId = Number(id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return NextResponse.json({ error: "Gecerli bir sirket secin" }, { status: 400 });
    }

    const accounts = await prisma.account.findMany({
      where: { ownerId: payload.userId },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    if (accounts.length <= 1) {
      return NextResponse.json({ error: "Son kalan sirket silinemez" }, { status: 409 });
    }

    const current = accounts.find((item) => item.id === accountId);
    if (!current) {
      return NextResponse.json({ error: "Sirket bulunamadi" }, { status: 404 });
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
      return NextResponse.json({ success: true });
    }

    const result = buildAuthResponse(user, nextActiveId);
    const response = NextResponse.json(result);
    response.cookies.set(AUTH_COOKIE_NAME, result.token!, getAuthCookieOptions(60 * 60 * 24));
    return response;
  } catch (error) {
    console.error("Sirket silme hatasi:", error);
    return NextResponse.json({ error: "Sirket silinemedi" }, { status: 500 });
  }
}
