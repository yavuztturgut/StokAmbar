import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLowStockEmail(
  to: string,
  ingredientName: string,
  currentStock: number,
  minStockLevel: number,
  unit: string
) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('E-posta gönderilemedi: SMTP yapılandırması eksik.');
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `"StokAmbar" <${process.env.SMTP_USER}>`,
    to,
    subject: `🚨 Stok Uyarısı: ${ingredientName} kritik seviyenin altında!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">Kritik Stok Uyarısı</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333;">Merhaba,</p>
          <p style="font-size: 16px; color: #333;">
            Deponuzdaki <strong>${ingredientName}</strong> isimli malzemenin stok miktarı belirlediğiniz minimum seviyenin altına düşmüştür.
          </p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 15px;"><strong>Mevcut Stok:</strong> <span style="color: #ef4444; font-weight: bold;">${currentStock} ${unit}</span></p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Minimum Seviye:</strong> ${minStockLevel} ${unit}</p>
          </div>
          <p style="font-size: 16px; color: #333;">
            Üretiminizde aksama yaşamamak için lütfen en kısa sürede stok tedariği yapınız.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: block; width: 100%; text-align: center; background-color: #3b82f6; color: white; padding: 12px 0; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
            Sisteme Giriş Yap
          </a>
        </div>
        <div style="background-color: #f3f4f6; color: #6b7280; text-align: center; padding: 15px; font-size: 12px;">
          <p style="margin: 0;">Bu e-posta StokAmbar sistemi tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Düşük stok e-postası başarıyla gönderildi: ${to}`);
  } catch (error) {
    console.error('E-posta gönderim hatası:', error);
  }
}
