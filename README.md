# 🏡 Harmoni — Platform Manajemen Keluarga Modern

**Harmoni** adalah platform SaaS manajemen keluarga terintegrasi yang dirancang khusus untuk memenuhi kebutuhan digital keluarga Indonesia. Memadukan kemudahan akses *mobile-first*, fungsionalitas Progressive Web App (PWA), dan antarmuka premium berestetika tinggi ala *modern startup/fintech*, Harmoni memusatkan seluruh kebutuhan logistik, finansial, dan komunikasi keluarga dalam satu platform terpadu.

---

## ✨ 14 Modul Utama Terintegrasi

Platform ini menyediakan modul lengkap yang saling terhubung untuk mempermudah operasional harian rumah tangga:

| Modul | Deskripsi & Kegunaan |
| :--- | :--- |
| **📊 Dashboard** | Ringkasan terpusat untuk keuangan bulanan, agenda hari ini, pengingat tagihan, serta status stok dapur. |
| **💰 Keuangan** | Pencatatan arus kas (pemasukan & pengeluaran) lengkap dengan kategori, unggah bukti transaksi, dan ekspor laporan. |
| **📊 Anggaran** | Penetapan limit belanja per kategori per bulan dengan indikator persentase real-time dan peringatan otomatis jika mendekati batas. |
| **🧾 Tagihan Rutin** | Manajemen pembayaran rutin (PLN, PDAM, internet, asuransi) disertai sistem pengingat tanggal jatuh tempo. |
| **🐔 Tabungan** | Target tabungan impian (*saving goals*) dengan celengan ayam interaktif dan pencatatan kontribusi berkala. |
| **🛡️ Dana Darurat** | Kalkulator simulasi jaring pengaman keuangan keluarga berdasarkan rata-rata pengeluaran bulanan. |
| **↔️ Hutang & Piutang** | Manajemen pencatatan hutang/piutang kepada pihak ketiga lengkap dengan riwayat cicilan pelunasan. |
| **📦 Stok Dapur** | Inventarisasi logistik dapur dengan fitur notifikasi otomatis ketika stok bahan makanan tertentu menipis. |
| **🛒 Daftar Belanja** | Daftar belanja interaktif dengan tingkat prioritas yang dapat ter-generate otomatis dari bahan makanan yang habis di stok dapur. |
| **🍽️ Meal Planner** | Perencana menu makan mingguan keluarga terintegrasi dengan daftar belanja bahan masakan yang dibutuhkan. |
| **📅 Agenda Keluarga** | Kalender kegiatan bersama, jadwal sekolah anak, janji medis, dan pengingat hari penting keluarga. |
| **👶 Tumbuh Kembang** | Pemantauan jadwal imunisasi nasional, pencatatan rekam tumbuh kembang anak (tinggi/berat badan), dan log aktivitas anak. |
| **📄 Dokumen Vault** | Ruang penyimpanan digital terenkripsi untuk dokumen penting (KTP, KK, Akta Lahir, Polis) dengan alert masa aktif berakhir. |
| **📈 Laporan Analisis** | Visualisasi statistik tren pengeluaran, anggaran, dan kesehatan keuangan keluarga dalam format grafik interaktif. |

---

## 🛠️ Arsitektur Teknologi

Harmoni dibangun menggunakan teknologi web modern berkinerja tinggi:

- **Frontend & Server**: Next.js 15 (App Router + Server Actions) dengan rendering dinamis yang cepat.
- **Bahasa Pemrograman**: TypeScript 5 (Strict Type-Safety).
- **Basis Data & ORM**: PostgreSQL dengan Prisma ORM untuk relasi data yang konsisten.
- **Autentikasi Keamanan**: Auth.js (NextAuth v5) dengan dukungan Credentials & Google OAuth.
- **Penyimpanan Berkas**: Cloudflare R2 Storage (S3-compatible API) untuk penyimpanan dokumen & bukti transaksi.
- **PWA (Progressive Web App)**: Service Worker bawaan agar dapat diinstal di Android & iOS dengan dukungan *offline caching*.
- **Desain UI/UX**: Tailwind CSS yang dikombinasikan dengan shadcn/ui dan Radix UI primitif.

---

## 🎨 Sistem Desain & Estetika

Harmoni mengadopsi bahasa desain modern yang premium dan interaktif:

- **Mode Terang (*Light Mode*)**: Menggunakan palet kontras tinggi berbasis *Slate-50* sebagai latar belakang utama, teks gelap *Slate-900* yang tajam, serta efek bayangan melayang yang lembut (*soft drop-shadows*) pada setiap kartu untuk kedalaman 3D yang elegan.
- **Mode Gelap (*Dark Mode*)**: Memanfaatkan estetika *glassmorphism* Web3 dengan latar belakang gelap pekat yang minim silau dan nyaman di mata untuk penggunaan malam hari.
- **Tipografi**: Menggunakan font modern tanpa-serif dengan skala hierarki yang tegas dan bersih.
- **Responsif**: Layout fleksibel yang dioptimalkan sepenuhnya untuk perangkat seluler maupun tablet.

---

## 🔐 Keamanan & Privasi Data

Privasi keluarga adalah prioritas utama. Platform ini dilengkapi dengan protokol keamanan standar industri:
- **Role-Based Access Control (RBAC)**: Pembagian akses anggota keluarga berdasarkan peran (Owner, Admin, Member, dan Child).
- **Enkripsi Sandi**: Proteksi kata sandi menggunakan hashing Bcrypt dengan faktor biaya tinggi.
- **Validasi Ketat**: Proteksi terhadap SQL Injection dan manipulasi input menggunakan skema validasi Zod di sisi server.
- **Audit Logs**: Sistem log aktivitas yang mencatat riwayat modifikasi data penting untuk transparansi internal keluarga.

---
*Dibuat untuk mempermudah keharmonisan manajemen rumah tangga Indonesia.*
