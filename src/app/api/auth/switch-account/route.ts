import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthSuccessResponse, loadAuthUser } from "@/lib/accountAuth";
import { requireAuth } from "@/lib/authMiddleware";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforcePostAuthRateLimit({ scope: "auth:switch-account", request });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const body = await request.json();
    const accountId = Number(body.accountId);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return withRateLimitHeaders(NextResponse.json({ error: "Gecerli bir sirket secin" }, { status: 400 }), rateLimit);
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return withRateLimitHeaders(NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 }), rateLimit);
    }

    if (!user.ownedAccounts.some((item) => item.id === accountId)) {
      return withRateLimitHeaders(NextResponse.json({ error: "Bu sirket kullaniciya ait degil" }, { status: 403 }), rateLimit);
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { accountId },
    });

    const refreshed = await loadAuthUser({ id: payload.userId });
    if (!refreshed) {
      return withRateLimitHeaders(NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 }), rateLimit);
    }

    return withRateLimitHeaders(createAuthSuccessResponse(refreshed, accountId, "1d"), rateLimit);
  } catch (error) {
    console.error("Sirket degistirme hatasi:", error);
    return NextResponse.json({ error: "Sirket degistirilemedi" }, { status: 500 });
  }
}
