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
import {
  clearFailedLoginState,
  enforceLoginRateLimit,
  recordFailedLoginAttempt,
  withRateLimitHeaders,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const parsedBody = loginSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 });
    }

    const { email, password, rememberMe } = parsedBody.data;
    const rateLimit = await enforceLoginRateLimit({
      request,
      email,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = async (body: unknown, status: number, failedAttempt: boolean = false) => {
      if (failedAttempt) {
        await recordFailedLoginAttempt({ request, email });
      }

      return withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);
    };

    const user = await loadAuthUser({ email });

    if (!user) {
      return respond({ error: "Gecersiz email veya sifre" }, 401, true);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return respond({ error: "Gecersiz email veya sifre" }, 401, true);
    }

    await clearFailedLoginState({ request, email });

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
