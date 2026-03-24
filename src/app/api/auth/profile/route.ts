import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {
  try {
    const payload = await requireAuth(request);

    if (payload instanceof NextResponse) {
      return payload;
    }

    // Kullanıcı ve hesap bilgisini getir
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        account: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
        phone: user.account.phone,
        createdAt: user.account.createdAt,
      },
    });
  } catch (error) {
    console.error('Profil hatası:', error);
    return NextResponse.json(
      { error: 'Profil bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await requireAuth(request);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const body = await request.json();
    const { accountName, accountPhone } = body;

    // Hesap bilgisini güncelle
    const updatedAccount = await prisma.account.update({
      where: { id: payload.accountId },
      data: {
        name: accountName || undefined,
        phone: accountPhone || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Profil güncellenemedi' },
      { status: 500 }
    );
  }
}

