import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getAuthCookieOptions, hashPassword } from "@/lib/auth";
import { buildAuthResponse, loadAuthUser } from "@/lib/accountAuth";
import { formatZodError, registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const parsedBody = registerSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: formatZodError(parsedBody.error) }, { status: 400 });
    }

    const { email, username, password, accountName, accountEmail, phone } = parsedBody.data;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Bu email veya username zaten kullaniliyor" }, { status: 400 });
    }

    const existingAccount = await prisma.account.findUnique({
      where: { email: accountEmail },
    });
    if (existingAccount) {
      return NextResponse.json({ error: "Bu hesap email adresi zaten kayitli" }, { status: 400 });
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
      return NextResponse.json({ error: "Kayit sonrasi kullanici bulunamadi" }, { status: 500 });
    }

    const result = buildAuthResponse(user, account.id);
    const response = NextResponse.json(result);
    response.cookies.set(AUTH_COOKIE_NAME, result.token!, getAuthCookieOptions(60 * 60 * 24 * 7));
    return response;
  } catch (error) {
    console.error("Kayit hatasi:", error);
    return NextResponse.json({ error: "Kayit sirasinda bir hata olustu" }, { status: 500 });
  }
}
