# Özellikler ve Kullanım

## 🔐 Kimlik Doğrulama Sistemi

### Hesap Oluşturma
- **Yeni hesap oluşturma**: Her kullanıcı kendi işletme/kişi bilgileri ile hesap açabilir
- **Hesap İzolasyonu**: Her hesabın kendi malzeme ve işlem verileri vardır
- **Güvenli Şifreleme**: Parolalar bcrypt ile 10 salt round'u ile şifrelenir
- **JWT Token**: Token tabanlı kimlik doğrulama, 7 gün geçerlilik süresi

### Giriş ve Çıkış
- **E-mail/Şifre Giriş**: E-mail adres ve şifre ile giriş yap
- **Oturum Yönetimi**: localStorage'da JWT token saklama
- **Otomatik Çıkış**: Geri döndürülen 401 hatasında otomatik çıkış

## 📦 Malzeme Yönetimi

### Malzeme Ekleme
- Malzeme adı, birim (kg, lt, adet, paket), başlangıç stoğu, minimum stok seviyesi
- Malzemeler hesaba göre izole edilir
- Otomatik aktivite kaydı oluşturulur

### Malzeme Düzenleme
- Malzeme adı, birim, minimum stok seviyesi değiştirebilirsin
- Her değişiklik işlem geçmişine kaydedilir

### Malzeme Silme
- Malzemeyi tamamen silebilirsin
- Silinen malzemenin tüm işlem kayıtları tutulur

## 📊 Stok Takibi

### Stok İşlemleri
1. **Stok Girişi (IN)**: Yeni stok eklediğinde
2. **Stok Çıkışı (OUT)**: Satış veya kullanım için stok çıkıştı
3. **Zayiat (WASTE)**: Sakatat veya hatalı ürün kaydı

### Özellikleri
- Negatif stok işlemine izin verme (sistem uyarı verir)
- Mevcut stok gerçek zamanlı güncelleme
- Her işlem için notlar ekleyebilme
- Karşılaştırmalı stok seviyeleri (Kritik/Normal)

## 📝 İşlem Geçmişi

### Tam Denetim İzleri
Tüm işlemler otomatik olarak kaydedilir:
- **Oluşturma**: Yeni malzeme eklemesi
- **Güncelleme**: Malzeme bilgileri değişikliği
- **Silme**: Malzeme silme işlemi
- **Stok Girişi**: Stok ekleme
- **Stok Çıkışı**: Stok düşüşü
- **Zayiat**: Hatalı/sakatat ürün

### Filtreleme ve Arama
- Malzeme adına göre ara
- İşlem türüne göre filtrele
- Tarih aralığında ara
- Pagination ile verileri görüntüle

## 👤 Profil Yönetimi

### Kullanıcı Profili
- Kullanıcı adı ve E-mail (değiştirilmez)
- Üyelik tarihi

### Hesap Bilgileri
- İşletme/Kişi adı (düzenlenebilir)
- Hesap E-maili (değiştirilmez)
- Telefon numarası (isteğe bağlı, düzenlenebilir)
- Hesap oluşturma tarihi

## 📊 Dashboard

### İstatistikler
- **Toplam Kalem**: Stokta kaç farklı malzeme var
- **Kritik Stok**: Minimum seviyenin altında kaç malzeme var

### Stok Durumu Tablosu
- Malzeme adı, birim, mevcut stok, minimum seviye
- Durum göstergesi (Normal/Kritik)
- Hızlı işlem butonları (Stok Ekle, Çıkar, Zayiat, Düzenle, Sil)

### Son İşlem Hareketleri
- Son 5 işlem görüntülenir
- İşlem türüne göre renk kodu
- İşlem tarihi ve detayları

## 🔒 Veri Güvenliği

### Hesap İzolasyonu
- Her hesabın kendi User(ler) vardır
- Her kullanıcı sadece kendi hesabının verilerine erişebilir
- API'de accountId kontrolü zorunludur

### İzin Yönetimi
- User sadece kendi hesabına ait Ingredient'ları görüntüleyebilir
- User sadece kendi hesabına ait işlemleri görebilir
- Başka hesaba ait kaynağa erişim 403 Forbidden döner

### Şifre Güvenliği
- Parolalar bcrypt ile şifrelenir
- Şifre hash'i veritabanında saklanır
- Giriş sırasında hash karşılaştırması yapılır

## 🌐 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni hesap oluştur
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/profile` - Profil bilgilerini getir
- `PUT /api/auth/profile` - Profil bilgilerini güncelle

### Malzemeler
- `GET /api/ingredients` - Tüm malzemeleri getir
- `POST /api/ingredients` - Yeni malzeme ekle
- `PATCH /api/ingredients/:id` - Malzemeyi güncelle
- `DELETE /api/ingredients/:id` - Malzemeyi sil

### İşlemler
- `POST /api/transactions` - Stok işlemi oluştur

### İşlem Geçmişi
- `GET /api/logs` - İşlem geçmişini getir (pagination destekli)

## 📱 Responsive Tasarım

- Mobile cihazlara uyumlu arayüz
- Tablet ve masaüstü için optimize edilmiş görünüm
- Touch-friendly butonlar ve kontroller

## 🎨 Kullanıcı Arayüzü

- **Modern Design**: Clean ve minimalist tasarım
- **Tailwind CSS**: Hızlı ve tutarlı styling
- **Lucide Icons**: Yüksek kaliteli ikonlar
- **Toast Notifications**: Hoş bildirimler
- **Loading States**: Yükleme durumu göstergeleri

## ⚡ Performans

- **React Query**: Veri yönetimi ve caching
- **Prisma ORM**: Hızlı veritabanı sorguları
- **TypeScript**: Tip güvenliği ile hata azaltma
- **Server-side Rendering**: SEO optimizasyonu

## 🔄 Veri İlişkileri

```
Account (Hesap)
  ├── Users (Kullanıcılar)
  ├── Ingredients (Malzemeler)
  ├── StockTransactions (Stok İşlemleri)
  └── ActivityLogs (Faaliyet Geçmişi)
```

Tüm veriler hesaba göre izole edilir ve sadece ilgili kullanıcılar tarafından erişilebilir.

