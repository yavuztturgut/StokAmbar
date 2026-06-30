import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authMiddleware";
import { formatZodError, profileUpdateSchema } from "@/lib/validation";
import { createAuthSuccessResponse, listAccounts, loadAuthUser, serializeAccount, serializeUser } from "@/lib/accountAuth";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    const activeAccount = user.ownedAccounts.find((item) => item.id === payload.accountId) ?? user.account;
    if (!activeAccount) {
      return NextResponse.json({ error: "Aktif sirket bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...serializeUser(user),
        accountId: activeAccount.id,
      },
      activeAccount: serializeAccount(activeAccount),
      accounts: listAccounts(user),
    });
  } catch (error) {
    console.error("Profil hatasi:", error);
    return NextResponse.json({ error: "Profil bilgileri alinamadi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const rateLimit = await enforcePostAuthRateLimit({
      scope: "auth:profile-update",
      request,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = profileUpdateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return respond({ error: "Kullanici bulunamadi" }, 404);
    }

    const nextAccountId = parsedBody.data.activeAccountId;
    if (nextAccountId === undefined) {
      return respond({ error: "Gecerli bir sirket secin" }, 400);
    }

    if (!user.ownedAccounts.some((item) => item.id === nextAccountId)) {
      return respond({ error: "Secilen sirket bu kullaniciya ait degil" }, 403);
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { accountId: nextAccountId },
    });

    const refreshed = await loadAuthUser({ id: payload.userId });
    if (!refreshed) {
      return respond({ error: "Kullanici bulunamadi" }, 404);
    }

    return withRateLimitHeaders(createAuthSuccessResponse(refreshed, nextAccountId, "1d"), rateLimit);
  } catch (error) {
    console.error("Profil guncelleme hatasi:", error);
    return NextResponse.json({ error: "Profil guncellenemedi" }, { status: 500 });
  }
}
