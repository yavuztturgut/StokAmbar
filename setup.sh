#!/bin/bash

echo "=========================================="
echo "  Stok Takip Sistemi - Kurulum Script'i"
echo "=========================================="
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Node modüllerini kontrol et
echo -e "${YELLOW}1. Bağımlılıkları kontrol ediliyor...${NC}"
if [ ! -d "node_modules" ]; then
    echo "node_modules klasörü bulunamadı. npm install çalıştırılıyor..."
    npm install
fi
echo -e "${GREEN}✓ Bağımlılıklar hazır${NC}"
echo ""

# 2. .env.local dosyası kontrol et
echo -e "${YELLOW}2. Çevre değişkenleri kontrol ediliyor...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local dosyası bulunamadı!${NC}"
    echo "Lütfen .env.example dosyasını .env.local olarak kopyala ve SQL Server bilgilerini doldur:"
    echo ""
    echo "  cp .env.example .env.local"
    echo ""
    echo "Sonra aşağıdaki bilgileri .env.local dosyasında güncelle:"
    echo "  - DATABASE_URL: SQL Server bağlantı string'i"
    echo "  - JWT_SECRET: Gizli anahtar (en az 32 karakter)"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ .env.local dosyası bulundu${NC}"
fi
echo ""

# 3. Prisma migrations çalıştır
echo -e "${YELLOW}3. Veritabanı migration'ları uygulanıyor...${NC}"
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Migration başarısız!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migration'lar başarıyla uygulandı${NC}"
echo ""

# 4. Prisma client oluştur
echo -e "${YELLOW}4. Prisma client oluşturuluyor...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma client oluşturuldu${NC}"
echo ""

# 5. Kurulumu tamamla
echo -e "${GREEN}=========================================="
echo "  Kurulum Başarıyla Tamamlandı! ✓"
echo "==========================================${NC}"
echo ""
echo "Geliştirme sunucusunu başlatmak için:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Tarayıcıda aç: ${YELLOW}http://localhost:3000${NC}"
echo ""

