import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuthSuccessResponse, loadAuthUser } from "@/lib/accountAuth";
import { formatZodError, registerSchema } from "@/lib/validation";
import { enforcePreAuthRateLimit, withRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json() as Record<string, unknown>;
    const rateLimit = await enforcePreAuthRateLimit({
      scope: "auth:register",
      request,
    });

    if (rateLimit instanceof NextResponse) {
      return rateLimit;
    }

    const respond = (body: unknown, status: number) =>
      withRateLimitHeaders(NextResponse.json(body, { status }), rateLimit);

    const parsedBody = registerSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: formatZodError(parsedBody.error) }, 400);
    }

    const { email, username, password, accountName, accountEmail, phone } = parsedBody.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return respond({ error: "Bu email veya username zaten kullaniliyor" }, 400);
    }

    const existingAccount = await prisma.account.findUnique({
      where: { email: accountEmail },
    });
    if (existingAccount) {
      return respond({ error: "Bu hesap email adresi zaten kayitli" }, 400);
    }

    const hashedPassword = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    const account = await prisma.account.create({
      data: {
        ownerId: createdUser.id,
        name: accountName,
        email: accountEmail,
        phone: phone || null,
      },
    });

    await prisma.user.update({
      where: { id: createdUser.id },
      data: { accountId: account.id },
    });

    const user = await loadAuthUser({ id: createdUser.id });
    if (!user) {
      return respond({ error: "Kayit sonrasi kullanici bulunamadi" }, 500);
    }

    return withRateLimitHeaders(createAuthSuccessResponse(user, account.id, "7d"), rateLimit);
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Kayit sirasinda bir hata olustu" }, { status: 500 });
  }
}
