import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  generateToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from "@/lib/auth";
import { formatZodError, registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const parsedBody = registerSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: formatZodError(parsedBody.error) },
        { status: 400 }
      );
    }

    const { email, username, password, accountName, accountEmail, phone } =
      parsedBody.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email veya username zaten kullanılıyor" },
        { status: 400 }
      );
    }

    const existingAccount = await prisma.account.findUnique({
      where: { email: accountEmail },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Bu hesap email adresi zaten kayıtlı" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const account = await prisma.account.create({
      data: {
        name: accountName,
        email: accountEmail,
        phone: phone || null,
      },
    });

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        accountId: account.id,
      },
    });

    const token = generateToken({
      userId: user.id,
      accountId: account.id,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountId: account.id,
        createdAt: user.createdAt,
      },
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt,
      },
    });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      getAuthCookieOptions(60 * 60 * 24 * 7)
    );

    return response;
  } catch (error) {
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
