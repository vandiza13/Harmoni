# 🏡 Harmoni — Platform Manajemen Keluarga

> Aplikasi SaaS manajemen keluarga modern untuk keluarga Indonesia.  
> Mobile-first · PWA · 14 Modul Lengkap · Siap Deploy ke Vercel & VPS

![Harmoni](https://placehold.co/1200x600/4CAF50/ffffff?text=Harmoni+Family+Management)

---

## ✨ Fitur Lengkap

| Modul | Deskripsi |
|-------|-----------|
| 📊 Dashboard | Overview keuangan, widget ringkasan, agenda hari ini |
| 💰 Keuangan | CRUD pemasukan & pengeluaran, bukti transaksi, export PDF/Excel |
| 📊 Anggaran | Budget per kategori, progress bar, peringatan otomatis |
| 🧾 Tagihan Rutin | PLN, PDAM, internet, BPJS — reminder otomatis |
| 🐷 Tabungan | Target tabungan, kontribusi, tracking progress |
| 🛡️ Dana Darurat | Kalkulator & simulasi dana darurat |
| ↔️ Hutang & Piutang | Catat pinjaman, riwayat pembayaran, reminder |
| 📦 Stok Dapur | Inventory dapur, alert stok menipis |
| 🛒 Daftar Belanja | Checklist, prioritas, auto-generate dari stok habis |
| 🍽️ Meal Planner | Menu mingguan/bulanan, daftar bahan otomatis |
| 📅 Agenda | Kalender keluarga, reminder, jadwal sekolah & kesehatan |
| 👶 Manajemen Anak | Imunisasi, tumbuh kembang, aktivitas anak |
| 📄 Dokumen | Vault dokumen keluarga (KTP, KK, BPJS), expiry reminder |
| 📈 Laporan | Laporan harian/bulanan/tahunan, export PDF & Excel |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router + Server Actions)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (Credentials + Google OAuth)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Storage**: Cloudflare R2
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State**: Zustand + TanStack Query
- **PWA**: Service Worker + Web Push

---

## 🚀 Quick Start (Development)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/harmoni.git
cd harmoni
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — **wajib diisi**:
```env
DATABASE_URL="postgresql://harmoni:harmoni_pass@localhost:5432/harmoni_db"
NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Setup Database

```bash
# Jalankan PostgreSQL (atau gunakan Docker di bawah)
docker run -d --name harmoni-db \
  -e POSTGRES_USER=harmoni \
  -e POSTGRES_PASSWORD=harmoni_pass \
  -e POSTGRES_DB=harmoni_db \
  -p 5432:5432 postgres:16-alpine

# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed data contoh
npm run db:seed
```

### 4. Install shadcn/ui Components

```bash
# Install semua komponen yang dibutuhkan
npx shadcn@latest add button input label textarea select
npx shadcn@latest add card badge progress separator
npx shadcn@latest add dialog sheet alert-dialog
npx shadcn@latest add dropdown-menu navigation-menu tabs
npx shadcn@latest add avatar checkbox radio-group switch
npx shadcn@latest add scroll-area tooltip popover
npx shadcn@latest add calendar toast sonner
npx shadcn@latest add skeleton accordion collapsible
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

**Demo account:**
- Email: `demo@harmoni.app`
- Password: `Demo1234!`

---

## 🐳 Docker (Local / VPS)

### Development dengan Docker Compose

```bash
# Jalankan semua services (app + db + redis)
docker compose up -d

# Jalankan migrasi
docker compose --profile migrate up migrate

# Lihat logs
docker compose logs -f app
```

### Production Build

```bash
# Build image
docker build -t harmoni:latest .

# Jalankan dengan environment production
docker compose -f docker-compose.yml up -d
```

---

## ☁️ Deploy ke Vercel

### 1. Push ke GitHub

```bash
git add . && git commit -m "Initial Harmoni setup"
git push origin main
```

### 2. Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository GitHub
3. Set environment variables (salin dari `.env.example`)
4. Deploy!

### 3. Setup Database (Vercel Postgres atau Supabase)

```bash
# Jalankan migrasi ke production database
DATABASE_URL="postgresql://..." npm run db:migrate:prod
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## 🖥️ Deploy ke VPS (Ubuntu)

### Prasyarat
- Ubuntu 22.04 LTS
- Docker + Docker Compose
- Domain + SSL (Let's Encrypt)

### Steps

```bash
# 1. Clone repository
git clone https://github.com/yourorg/harmoni.git /opt/harmoni
cd /opt/harmoni

# 2. Copy dan edit environment
cp .env.example .env
nano .env  # Edit semua variabel

# 3. Jalankan dengan Docker Compose
docker compose up -d

# 4. Jalankan migrasi
docker compose --profile migrate up migrate

# 5. Setup Nginx reverse proxy
# Contoh konfigurasi:
# server {
#   listen 80;
#   server_name harmoni.yourdomain.com;
#   location / {
#     proxy_pass http://localhost:3000;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection 'upgrade';
#     proxy_set_header Host $host;
#     proxy_cache_bypass $http_upgrade;
#   }
# }

# 6. SSL dengan Certbot
certbot --nginx -d harmoni.yourdomain.com
```

### Deploy ke Coolify / Dokploy

1. Create new service → Docker Compose
2. Upload `docker-compose.yml`
3. Set environment variables di dashboard
4. Deploy!

---

## 📁 Struktur Proyek

```
harmoni/
├── prisma/
│   ├── schema.prisma       # Database schema (24+ entities)
│   └── seed.ts             # Sample data
├── public/
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service Worker
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login, Register, Reset Password
│   │   ├── (dashboard)/    # 14 module pages
│   │   ├── api/            # Route handlers
│   │   └── setup/          # Onboarding
│   ├── actions/            # Server Actions
│   │   ├── auth.ts
│   │   ├── family.ts
│   │   ├── finance.ts
│   │   └── modules.ts      # Bills, Savings, Inventory, etc.
│   ├── components/
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── finance/        # Finance components
│   │   ├── layout/         # Sidebar, Header, MobileNav
│   │   ├── providers/      # Theme, Query providers
│   │   ├── shared/         # Reusable components
│   │   └── ui/             # shadcn components
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config
│   │   ├── export.ts       # PDF/Excel export
│   │   ├── prisma.ts       # DB singleton
│   │   ├── utils.ts        # Helper functions
│   │   └── validations.ts  # Zod schemas
│   └── types/
│       └── index.ts        # TypeScript types
├── .env.example
├── components.json         # shadcn config
├── docker-compose.yml
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database Schema

**24+ entities** mencakup:
- `User`, `Account`, `Session` — NextAuth
- `Family`, `FamilyMember` — Multi-family workspace
- `Income`, `Expense`, `Category`, `Budget` — Keuangan
- `Bill`, `BillPayment` — Tagihan rutin
- `SavingGoal`, `SavingContribution` — Tabungan
- `EmergencyFund` — Dana darurat
- `Debt`, `DebtPayment`, `Receivable` — Hutang piutang
- `Inventory`, `InventoryTransaction` — Stok dapur
- `ShoppingList`, `ShoppingItem` — Belanja
- `MealPlan`, `MealPlanItem` — Meal planner
- `CalendarEvent` — Agenda
- `Child`, `Immunization`, `GrowthRecord` — Manajemen anak
- `Document` — Dokumen keluarga
- `Notification`, `ActivityLog` — Sistem

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#4CAF50` (hijau) |
| Secondary | `#81C784` |
| Accent | `#FFB74D` (oranye) |
| Background | `#F9FBF8` |
| Text | `#263238` |
| Border Radius | `12px` (rounded) |
| Touch Target | `44px` min |

---

## 📱 PWA Features

- ✅ Install ke Home Screen (Android & iOS)
- ✅ Offline support dengan Service Worker
- ✅ Push notifications (bill reminder, stok habis, dll)
- ✅ Background sync
- ✅ App shortcuts

---

## 🔐 Security

- RBAC (Owner/Admin/Member/Child)
- CSRF protection via NextAuth
- Rate limiting di upload endpoint
- Input validation dengan Zod (semua form)
- Secure file upload dengan validasi MIME type
- Password hashing dengan bcrypt (cost 12)
- Audit log semua aksi penting
- Session JWT dengan expiry 30 hari

---

## 🤝 Development Guide

### Menambah Modul Baru

1. Tambah entity di `prisma/schema.prisma`
2. Jalankan `npm run db:push`
3. Tambah Zod schema di `src/lib/validations.ts`
4. Buat server actions di `src/actions/`
5. Buat page di `src/app/(dashboard)/[modul]/page.tsx`
6. Tambah nav item di `src/components/layout/sidebar.tsx`

### Konvensi Kode

- Server Components untuk data fetching
- Server Actions untuk mutations (bukan API routes)
- Client Components hanya untuk interaktivitas
- Validasi di server **dan** client
- Semua error ditangani dengan `ActionResult<T>`

---

## 📞 Support

- 📧 Email: support@harmoni.app
- 📚 Docs: docs.harmoni.app
- 🐛 Issues: github.com/yourorg/harmoni/issues

---

*Dibuat dengan ❤️ untuk keluarga Indonesia*
