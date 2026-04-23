import { NextRequest, NextResponse } from 'next/server';
import { scheduleEmail } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subject, message, scheduledTime } = body;

    if (!email || !subject || !message || !scheduledTime) {
      return NextResponse.json(
        { error: 'Lütfen tüm alanları doldurun.' },
        { status: 400 }
      );
    }

    const date = new Date(scheduledTime);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Geçersiz tarih formatı.' },
        { status: 400 }
      );
    }

    if (date < new Date()) {
      return NextResponse.json(
        { error: 'Geçmiş bir zamana planlama yapılamaz.' },
        { status: 400 }
      );
    }

    const taskId = scheduleEmail(email, subject, message, date);

    return NextResponse.json({
      success: true,
      message: 'E-posta başarıyla planlandı.',
      taskId,
      scheduledTime: date.toLocaleString()
    });
  } catch (error) {
    console.error('Planlama hatası:', error);
    return NextResponse.json(
      { error: 'E-posta planlanırken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
