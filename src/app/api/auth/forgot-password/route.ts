import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRandomToken, hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema, formatZodError } from "@/lib/validation";
import { enforcePreAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const rateLimit = await enforcePreAuthRateLimit({
      scope: "auth:forgot-password",
      request,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = forgotPasswordSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedBody.data.email },
      select: { id: true, email: true },
    });

    if (user) {
      const token = createRandomToken();
      const tokenHash = hashToken(token);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      });

      await sendPasswordResetEmail(user.email, token);
    }

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        message: "Eger bu e-posta sistemde kayitliysa sifre sifirlama baglantisi gonderildi.",
      }),
      rateLimit
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Sifre sifirlama istegi olusturulamadi" }, { status: 500 });
  }
}
