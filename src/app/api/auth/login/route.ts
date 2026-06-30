import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { formatZodError, loginSchema } from "@/lib/validation";
import {
  createAuthSuccessResponse,
  listAccounts,
  loadAuthUser,
  serializeUser,
  signSelectionToken,
} from "@/lib/accountAuth";
import { enforcePreAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const rateLimit = await enforcePreAuthRateLimit({
      scope: "auth:login",
      request,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = loginSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const { email, password, rememberMe } = parsedBody.data;
    const user = await loadAuthUser({ email });

    if (!user) {
      return respond({ error: "Gecersiz email veya sifre" }, 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return respond({ error: "Gecersiz email veya sifre" }, 401);
    }

    const accounts = listAccounts(user);
    if (!accounts.length) {
      return respond({ error: "Bu kullaniciya ait hesap bulunamadi" }, 403);
    }

    if (accounts.length > 1) {
      return withRateLimitHeaders(
        NextResponse.json({
          success: true,
          requiresCompanySelection: true,
          user: serializeUser(user),
          accounts,
          selectionToken: signSelectionToken(
            user.id,
            accounts.map((item) => item.id),
            rememberMe,
            user.tokenVersion
          ),
        }),
        rateLimit
      );
    }

    return withRateLimitHeaders(
      createAuthSuccessResponse(user, accounts[0].id, rememberMe ? "30d" : "1d"),
      rateLimit
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Giris sirasinda bir hata olustu" }, { status: 500 });
  }
}
