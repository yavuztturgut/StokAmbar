import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAuthResponse, loadAuthUser } from "@/lib/accountAuth";
import { requireAuth } from "@/lib/authMiddleware";

export async function POST(request: NextRequest) {
  try {
    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const body = await request.json();
    const accountId = Number(body.accountId);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      return NextResponse.json({ error: "Gecerli bir sirket secin" }, { status: 400 });
    }

    const user = await loadAuthUser({ id: payload.userId });
    if (!user) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    if (!user.ownedAccounts.some((item) => item.id === accountId)) {
      return NextResponse.json({ error: "Bu sirket kullaniciya ait degil" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { accountId },
    });

    const refreshed = await loadAuthUser({ id: payload.userId });
    if (!refreshed) {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    const result = buildAuthResponse(refreshed, accountId, "1d");
    const response = NextResponse.json(result);
    response.cookies.set(AUTH_COOKIE_NAME, result.token!, getAuthCookieOptions(60 * 60 * 24));
    return response;
  } catch (error) {
    console.error("Sirket degistirme hatasi:", error);
    return NextResponse.json({ error: "Sirket degistirilemedi" }, { status: 500 });
  }
}
