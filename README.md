# Stok Takip Sistemi

Hesap tabanlı stok yönetim sistemi. Kullanıcılar hesap oluşturarak kendi stok verilerini yönetebilir, işlemleri takip edebilir.

## Özellikler

- **Hesap Yönetimi**: Her kullanıcı kendi hesabını oluşturur ve yönetir
- **Malzeme Yönetimi**: Malzeme ekleme, düzenleme, silme
- **Stok Takibi**: Giriş, çıkış ve atık işlemlerini kaydetme
- **İşlem Geçmişi**: Tüm işlemlerin detaylı günlüğü
- **Hesap İzolasyonu**: Her hesabın kendi verileri vardır

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Veritabanı Ayarı
`.env.local` dosyası oluştur:
```
DATABASE_URL="sqlserver://server:port;database=stok_takip;user=sa;password=YourPassword;trustServerCertificate=true"
JWT_SECRET="stok-takip-gizli-anahtar-degistir"
```

### 3. Prisma Migration
```bash
npx prisma migrate deploy
```

## Kullanım

### Geliştirme Modu
```bash
npm run dev
```
[http://localhost:3000](http://localhost:3000) adresine git

### Build ve Çalıştırma
```bash
npm run build
npm start
```

## Kullanıcı Akışı

1. **Kayıt Ol** (`/register`): Yeni hesap ve kullanıcı oluştur
2. **Giriş Yap** (`/login`): Mevcut hesaba giriş yap
3. **Dashboard** (`/`): Stok listesi ve işlem yönetimi
4. **İşlem Geçmişi** (`/logs`): Tüm işlemleri görüntüle
5. **Profil** (`/profile`): Hesap bilgilerini yönet

## Teknolojiler

- **Next.js 16** - Web framework
- **TypeScript** - Tip güvenliği
- **Prisma** - Veritabanı ORM
- **SQL Server** - Veritabanı
- **Tailwind CSS** - Stil
- **React Query** - Veri yönetimi
- **JWT** - Kimlik doğrulama

## Veritabanı Modeli

- **User**: Kullanıcı hesabı ve kimlik doğrulama
- **Account**: İşletme/kişi bilgileri
- **Ingredient**: Malzeme bilgileri (accountId ile bağlı)
- **StockTransaction**: Stok işlemleri
- **ActivityLog**: Tüm işlemlerin günlüğü

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu başlat |
| `npm run build` | Production build oluştur |
| `npm start` | Production modunda çalıştır |
| `npm run lint` | Kod kontrolü yap |

## Notlar

- Tüm veriler hesaba göre izole edilir
- Şifreler bcrypt ile şifrelenir
- JWT token ile oturum yönetimi
- SQL Server ile veritabanı yönetimi

