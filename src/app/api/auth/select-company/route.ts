import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAuthResponse, loadAuthUser, parseSelectionToken } from "@/lib/accountAuth";
import { formatZodError, selectCompanySchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const parsedBody = selectCompanySchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const selection = parseSelectionToken(parsedBody.data.selectionToken);
    if (!selection.accountIds.includes(parsedBody.data.accountId)) {
      return NextResponse.json(
        { error: "Secilen sirket bu kullaniciya ait degil" },
        { status: 403 }
      );
    }

    const user = await loadAuthUser({ id: selection.userId });
    if (!user) {
      return NextResponse.json(
        { error: "Kullanici bulunamadi" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: selection.userId },
      data: { accountId: parsedBody.data.accountId },
    });

    const refreshed = await loadAuthUser({ id: selection.userId });
    if (!refreshed) {
      return NextResponse.json(
        { error: "Kullanici bulunamadi" },
        { status: 404 }
      );
    }

    const result = buildAuthResponse(
      refreshed,
      parsedBody.data.accountId,
      selection.rememberMe ? "30d" : "1d"
    );

    const response = NextResponse.json(result);
    response.cookies.set(
      AUTH_COOKIE_NAME,
      result.token!,
      getAuthCookieOptions(selection.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24)
    );

    return response;
  } catch (error) {
    console.error("Sirket secme hatasi:", error);
    return NextResponse.json(
      { error: "Sirket secimi sirasinda bir hata olustu" },
      { status: 500 }
    );
  }
}
