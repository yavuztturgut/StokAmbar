import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, accountName, accountEmail, phone } = body;

    // Validasyon
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username ve password gereklidir' },
        { status: 400 }
      );
    }

    if (!accountName || !accountEmail) {
      return NextResponse.json(
        { error: 'Hesap adı ve email gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcı/Email zaten var mı kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email veya username zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Hesap email zaten var mı kontrol et
    const existingAccount = await prisma.account.findUnique({
      where: { email: accountEmail },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Bu hesap email adresi zaten kayıtlı' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await hashPassword(password);

    // Yeni hesap ve kullanıcı oluştur
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

    // Token oluştur
    const token = generateToken({
      userId: user.id,
      accountId: account.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        accountId: account.id,
      },
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
      },
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}

