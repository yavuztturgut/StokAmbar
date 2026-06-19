import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  generateToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from "@/lib/auth";
import { formatZodError, loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const parsedBody = loginSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        account: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Geçersiz email veya şifre" },
        { status: 401 }
      );
    }

    const token = generateToken(
      {
        userId: user.id,
        accountId: user.accountId,
        email: user.email,
      },
      rememberMe ? "30d" : "1d"
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountId: user.accountId,
        createdAt: user.createdAt,
      },
      account: {
        id: user.account.id,
        name: user.account.name,
        email: user.account.email,
        createdAt: user.account.createdAt,
      },
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions(rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24)
    );

    return response;
  } catch (error) {
    console.error("Giriş hatası:", error);
    return NextResponse.json(
      { error: "Giriş sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
