import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuthSuccessResponse, loadAuthUser, parseSelectionToken } from "@/lib/accountAuth";
import { formatZodError, selectCompanySchema } from "@/lib/validation";
import { enforcePreAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const rateLimit = await enforcePreAuthRateLimit({
      scope: "auth:select-company",
      request,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = selectCompanySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const selection = parseSelectionToken(parsedBody.data.selectionToken);
    if (!selection.accountIds.includes(parsedBody.data.accountId)) {
      return respond({ error: "Secilen sirket bu kullaniciya ait degil" }, 403);
    }

    const user = await loadAuthUser({ id: selection.userId });
    if (!user) {
      return respond({ error: "Kullanici bulunamadi" }, 404);
    }

    if (user.tokenVersion !== selection.tokenVersion) {
      return respond({ error: "Gecersiz veya suresi dolmus secim tokeni" }, 401);
    }

    await prisma.user.update({
      where: { id: selection.userId },
      data: { accountId: parsedBody.data.accountId },
    });

    const refreshed = await loadAuthUser({ id: selection.userId });
    if (!refreshed) {
      return respond({ error: "Kullanici bulunamadi" }, 404);
    }

    return withRateLimitHeaders(
      createAuthSuccessResponse(
        refreshed,
        parsedBody.data.accountId,
        selection.rememberMe ? "30d" : "1d"
      ),
      rateLimit
    );
  } catch (error) {
    console.error("Select company error:", error);
    return NextResponse.json({ error: "Sirket secimi sirasinda bir hata olustu" }, { status: 500 });
  }
}
