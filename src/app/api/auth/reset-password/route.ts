import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashToken } from "@/lib/auth";
import { formatZodError, resetPasswordSchema } from "@/lib/validation";
import { enforcePreAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const rateLimit = await enforcePreAuthRateLimit({
      scope: "auth:reset-password",
      request,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = resetPasswordSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const tokenHash = hashToken(parsedBody.data.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return respond({ error: "Gecersiz veya suresi dolmus baglanti" }, 400);
    }

    const nextPassword = await hashPassword(parsedBody.data.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.user.id },
        data: {
          password: nextPassword,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.user.id,
          id: { not: resetToken.id },
        },
      });
    });

    return withRateLimitHeaders(NextResponse.json({ success: true }), rateLimit);
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Sifre yenilenemedi" }, { status: 500 });
  }
}
