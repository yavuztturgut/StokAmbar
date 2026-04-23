import { sendCustomEmail } from './src/lib/email';

async function send() {
  console.log('E-posta gönderimi başlatılıyor...');
  const result = await sendCustomEmail(
    'ibrahimkrktn@gmail.com', 
    'StokAmbar - Test Bildirimi', 
    'Merhaba, bu test maili sistemin çalışıp çalışmadığını kontrol etmek amacıyla gönderilmiştir.'
  );
  console.log('Sonuç:', result);
}

send().catch(console.error);
