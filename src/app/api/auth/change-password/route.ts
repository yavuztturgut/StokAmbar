import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { requireAuth } from "@/lib/authMiddleware";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema, formatZodError } from "@/lib/validation";
import { enforcePostAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforcePostAuthRateLimit({
      scope: "auth:change-password",
      request,
    });
    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const payload = await requireAuth(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = changePasswordSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, password: true },
    });
    if (!user) {
      return respond({ error: "Kullanici bulunamadi" }, 404);
    }

    const isPasswordValid = await verifyPassword(parsedBody.data.currentPassword, user.password);
    if (!isPasswordValid) {
      return respond({ error: "Mevcut sifre hatali" }, 401);
    }

    const nextPassword = await hashPassword(parsedBody.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: nextPassword,
        tokenVersion: { increment: 1 },
      },
    });

    return withRateLimitHeaders(
      clearAuthCookie(NextResponse.json({ success: true })),
      rateLimit
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Sifre degistirilemedi" }, { status: 500 });
  }
}
