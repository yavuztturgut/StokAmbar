# Kurulum Rehberi

## Sistem Gereksinimleri

- Node.js 18+ 
- npm veya yarn
- SQL Server 2019+

## Adım 1: Proje Dosyalarını İndir

```bash
git clone <proje-url>
cd stok-takip
```

## Adım 2: Bağımlılıkları Yükle

```bash
npm install
```

## Adım 3: Çevre Değişkenlerini Ayarla

`.env.local` dosyası oluştur ve aşağıdakini ekle:

```
DATABASE_URL="sqlserver://SERVER_ADI:1433;database=stok_takip;user=sa;password=SIFREN;trustServerCertificate=true"
JWT_SECRET="stok-takip-gizli-anahtar-degistir-production-icin"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Değişken Açıklamaları

- **DATABASE_URL**: SQL Server bağlantı stringi
  - `SERVER_ADI`: SQL Server'ınız çalışan bilgisayar adı (localhost, IP adresi veya domain)
  - `1433`: SQL Server default portu
  - `sa`: SQL Server admin kullanıcısı
  - `SIFREN`: SQL Server sa kullanıcısının şifresi
  - `trustServerCertificate=true`: SSL sertifikası doğrulamasını devre dışı bırak (geliştirme ortamı için)

- **JWT_SECRET**: JWT token'larını imzalamak için gizli anahtar (en az 32 karakter olmalı)

- **NEXT_PUBLIC_API_URL**: API endpoint'inin base URL'i

## Adım 4: Veritabanını Başlat

```bash
npx prisma migrate deploy
```

Veya geliştirme ortamında:

```bash
npx prisma migrate dev
```

## Adım 5: Sunucuyu Başlat

### Geliştirme Modu
```bash
npm run dev
```

Tarayıcıda: http://localhost:3000

### Production Modu
```bash
npm run build
npm start
```

## İlk Hesap Oluşturma

1. http://localhost:3000 adresine git
2. "Kayıt Ol" linki'ne tıkla
3. Aşağıdaki bilgileri gir:

**Kullanıcı Bilgileri:**
- Email: ornek@email.com
- Kullanıcı Adı: ornek_kullanici
- Şifre: gulugulu123

**Hesap Bilgileri:**
- İşletme Adı: ABC Gıda Ltd.
- Hesap Email: info@abcgida.com
- Telefon: +90 (555) 123-4567 (isteğe bağlı)

4. Hesabın oluşturulduğunu ve otomatik giriş yaptığını göreceksin
5. Dashboard'a yönlendirileceksin

## Veritabanı Yönetimi

### Prisma Studio (GUI)
```bash
npx prisma studio
```
http://localhost:5555 adresinde açılır ve veritabanını görsel olarak yönetebilirsin.

### Migrasyonları Kontrol Et
```bash
npx prisma migrate status
```

### Yeni Migration Oluştur
```bash
npx prisma migrate dev --name migration_adi
```

## Sorun Giderme

### "DATABASE_URL not set" hatası
- .env.local dosyasının olup olmadığını kontrol et
- DATABASE_URL değişkeninin doğru olup olmadığını kontrol et

### SQL Server bağlantı hatası
- SQL Server'ın çalışıyor olduğunu kontrol et
- Firewall'da 1433 portunun açık olup olmadığını kontrol et
- Connection string'i doğru girip girmediğini kontrol et

### "Port 3000 already in use" hatası
```bash
# Port 3000'i açık yapmak için:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F
```

## Geliştirme Komutları

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build
npm start        # Production sunucusu
npm run lint     # ESLint kontrolü
```

## Dosya Yapısı

```
stok-takip/
├── src/
│   ├── app/                    # Next.js uygulaması
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/         # Kimlik doğrulama
│   │   │   ├── ingredients/  # Malzeme API
│   │   │   ├── logs/         # İşlem geçmişi API
│   │   │   └── transactions/ # Stok işlemleri API
│   │   ├── login/            # Giriş sayfası
│   │   ├── register/         # Kayıt sayfası
│   │   ├── profile/          # Profil sayfası
│   │   ├── logs/             # İşlem geçmişi sayfası
│   │   ├── page.tsx          # Dashboard
│   │   └── layout.tsx        # Global layout
│   ├── components/           # React bileşenleri
│   ├── context/              # Context API
│   │   └── AuthContext.tsx   # Kimlik doğrulama context
│   ├── lib/                  # Yardımcı fonksiyonlar
│   │   ├── auth.ts           # JWT ve şifreleme fonksiyonları
│   │   ├── authMiddleware.ts # API middleware
│   │   └── prisma.ts         # Prisma client
│   └── types/                # TypeScript interface'leri
├── prisma/
│   ├── schema.prisma         # Veritabanı şeması
│   └── migrations/           # Migration dosyaları
├── public/                   # Statik dosyalar
└── package.json              # Bağımlılıklar
```

## Önemli Notlar

1. **JWT Secret**: Production ortamında JWT_SECRET değerini güçlü ve gizli tutmalısın
2. **Veritabanı Backup**: Düzenli olarak veritabanını backup al
3. **HTTPS**: Production ortamında HTTPS kullan
4. **Şifre Policy**: Kullanıcı parolaları bcrypt ile şifrelenir (10 salt round)
5. **Token Expiry**: JWT token'ları 7 gün geçerli

## İletişim ve Destek

Herhangi bir sorun yaşarsan, GitHub issues sekmesinden bildirim yapabilirsin.

