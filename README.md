<div align="center">

# 🚲⚡ GowesKit
### *Platform Cerdas, Paspor Sepeda & Sahabat Pesepeda Indonesia*

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Nuxt 3](https://img.shields.io/badge/Nuxt_3-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white)](https://nuxt.com/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![PostgreSQL & PostGIS](https://img.shields.io/badge/PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Tests Passing](https://img.shields.io/badge/Tests-79%20passed%20%7C%20100%25-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>"Bukan sekadar gowes, pahami sepedamu luar-dalam!"</strong><br />
  Edukasi Anatomi Sepeda · Paspor Digital (Garage) · Cek Kompatibilitas Upgrade Deterministik · Peta Jalur & Pitstop Kopi · Jadwal Mabar Komunitas · Ride Safety Token · Servis Berkala · Ride Flex Studio AI
</p>

[🌟 Mengapa GowesKit?](#-mengapa-goweskit) •
[🚲 Fitur Utama](#-fitur-utama--arsitektur-modul) •
[🔬 Standar Resmi](#-transparansi-standar-resmi-industri) •
[🚀 Quick Start](#-panduan-menjalankan-secara-lokal-quick-start) •
[🚢 Panduan Deploy](#-panduan-deployment-ke-production-vps--cloud) •
[💖 Donasi GoPay](#-dukung-pengembangan-goweskit-donasi)

</div>

---

## 🌟 Mengapa GowesKit?

Setiap pesepeda — baik pemula maupun antusias — sering kali menghadapi dilema teknis saat merawat atau meng-upgrade sepedanya:

* ❓ *"Apakah groupset 12-speed Shimano Micro Spline bisa dipasang di freehub HG lama saya?"*
* ❓ *"Fork tapered 1.5 inch ini muat di headtube straight 44mm tanpa ganti headset?"*
* ❓ *"Bagaimana cara mencatat riwayat servis dan masa pakai rantai secara teratur?"*
* ❓ *"Di mana rute aman, warung makan ramah pesepeda, dan titik pitstop kopi terdekat?"*

**GowesKit** lahir untuk menjawab semua pertanyaan tersebut. Dibangun dengan **100% Deterministic Compatibility Engine** berbasis standar internasional resmi (ISO, SHIS, Park Tool, Shimano/SRAM), GowesKit memberikan jawaban pasti dan transparan tanpa tebak-tebakan.

---

## 🚲 Fitur Utama & Arsitektur Modul

```text
                                    ┌───────────────────────┐
                                    │    🚲 GOWESKIT WEB    │
                                    │   (Nuxt 3 + Vue 3)    │
                                    └───────────┬───────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
     ┌───────────────────────┐      ┌───────────────────────┐      ┌───────────────────────┐
     │   📚 LEARN & GARAGE   │      │   🧪 UPGRADE LAB      │      │   🗺️ EXPLORE & SAFETY │
     │  - Anatomi 4 Tipe     │      │  - 100% Deterministik │      │  - Radius PostGIS Map │
     │  - Paspor Sepeda      │      │  - 15 Standar Baku    │      │  - Live Safety Token  │
     │  - Servis Berkala     │      │  - Provenance ISO/SHIS│      │  - Jadwal Mabar Klub  │
     └───────────────────────┘      └───────────────────────┘      └───────────────────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │    ⚡ FASTIFY API     │
                                    │  (TypeScript Strict)  │
                                    └───────────┬───────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │  🐘 POSTGRESQL + GIS  │
                                    │   (Drizzle ORM + GIS) │
                                    └───────────────────────┘
```

### 1. 📚 Learn Center (Pusat Edukasi Sepeda)
* **4 Kategori Sepeda Utama**: Panduan komprehensif untuk *Road Bike*, *MTB Hardtail*, *Folding Bike (Seli)*, dan *Gravel Bike*.
* **Glosarium Istilah Interaktif**: Penjelasan gamblang standar teknis seperti *Thru-Axle vs Quick Release*, *DUB vs Hollowtech II*, *Boost 148*, *UDH (Universal Derailleur Hanger)*, dan *Flat Mount vs Post Mount*.

### 2. 🛠️ My Garage & Paspor Sepeda Digital
* **Spesifikasi Lengkap**: Simpan detail wheelset, bottom bracket, headset, groupset, rem, kokpit, dan saddle.
* **Explicit Unknown Tracking**: Jika ada standar sepeda yang belum diketahui, sistem menandainya sebagai `Unknown` secara transparan dan menyediakan panduan cara mengukurnya menggunakan jangka sorong (*caliper*).
* **Paspor Sepeda Siap Audit**: Bagikan spesifikasi sepeda saat konsultasi dengan mekanik bengkel.

### 3. 🧪 Upgrade Lab (Mesin Kompatibilitas Deterministik)
* **Evaluasi Instan & Akurat**: Pilih sepeda Anda dan tentukan suku cadang yang ingin dibeli.
* **Status Evaluasi Terstandarisasi**:
  * ✅ **Compatible** — Plug & play sesuai standar baku.
  * ⚠️ **Conditional** — Memerlukan spacer, adapter crown race, atau freehub body konversi.
  * ❌ **Incompatible** — Tidak muat secara mekanis/geometri.
  * ❓ **Unknown Specs** — Membutuhkan data tambahan dari pengguna.
* **Audit Provenance Box**: Menampilkan versi aturan, nomor standar ISO/SHIS, dan tanggal verifikasi untuk setiap hasil evaluasi.

### 4. 🗺️ Explore & Navigasi Gowes (PostGIS Privacy-First)
* **Titik Penting Pesepeda**: Temukan bengkel sepeda, toko sparepart, titik pitstop kopi, minimarket, water station, dan jalur gowes terdekat.
* **Privasi Terlindungi**: Menggunakan kueri spasial PostGIS berbasis radius — koordinat lokasi persis pengguna tidak pernah disimpan atau dipublikasikan.
* **OpenFreeMap & Offline Navigator**: Peta interaktif berbasis MapLibre yang ringan dan tetap dapat diakses saat minim sinyal.

### 5. 👥 Komunitas & Jadwal Mabar
* **Direktori Klub Lokal**: Bergabung dengan komunitas pesepeda di kota Anda (Road, MTB, Gravel, Foldie).
* **Jadwal Gowes Bareng**: Informasi titik kumpul (*meeting point*), rute, total elevasi, dan rata-rata kecepatan (*pace*).
* **Manajemen Pendaftaran Mabar**: Pengingat otomatis dan status keanggotaan terintegrasi.

### 6. 🛡️ Ride Safety (Pelacak Solo-Ride & SOS)
* **High-Entropy Expiring Share Token**: Bagikan tautan pelacakan sementara yang aman ke keluarga atau kontak tepercaya.
* **Sesi Terkendali Penuh**: Pelacakan hanya aktif atas inisiatif pengguna dan dapat dicabut/diakhiri kapan saja.

### 7. 🔧 Maintenance Log & Interval Tracker
* **Pengingat Perawatan Berkala**: Rekomendasi servis rantai, pengecekan kampas rem (*brake pads*), bleeding oli rem hidrolik, hingga servis suspensi.
* **Riwayat Servis**: Dokumentasi catatan mekanik untuk menjaga performa sepeda selalu prima dan nilai jual kembali tetap tinggi.

### 8. 📸 Ride Flex Studio AI
* **Poster Generator Estetik**: Transformasi data gowes menjadi karya visual modern siap posting untuk Instagram Story (9:16), Feed Post (1:1), atau Banner (16:9).
* **4 Gaya Desain Unik**:
  * ⚡ **Strava Bold**: Tipografi tebal dan aksen Kinetic Neon Green.
  * 🏔️ **Rapha Editorial**: Tipografi serif elegan dan layout etappe klasik.
  * 📡 **Cyber HUD**: Tampilan sensor telemetry grid neon.
  * ☕ **Kopi & Sate**: Warna hangat golden amber untuk santai kulineran.
* **Spektrum Elevasi & Rute GPS**: Visualisasi jalur rute dengan glowing track dan waypoint pitstop.
* **Generator Caption AI Multi-Persona**: Buat caption menarik (*Peloton Pro, Anak Senoparty, Mekanik Senior, Komuter Santai*).

---

## 🔬 Transparansi Standar Resmi Industri

GowesKit menolak klaim sepihak. Seluruh mesin kompatibilitas mengacu pada dokumen standar resmi:

1. **ISO 5775-1 / ISO 4210**: Standar dimensi ban, diameter velg (ETRTO/BSD: 622mm, 584mm, 406mm, 451mm), dan keselamatan rangka sepeda.
2. **SHIS (Standardized Headset Identification System)**: Standar identifikasi headset terpadu dari Cane Creek, FSA, dan Park Tool (EC, ZS, IS).
3. **Park Tool Bottom Bracket & Axle Standards**: Rujukan standar ulir (BSA, Italian), PressFit (BB86, BB92, PF30, BB30, T47), dan diameter poros (DUB 28.99mm, 24mm Spindle, 30mm Spindle).
4. **Shimano & SRAM Official Compatibility Matrices**: Standar spline freehub (HG, Micro Spline, XD/XDR) dan rasio penarikan kabel derailleur.

---

## 💻 Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Frontend** | Nuxt 3, Vue 3, TypeScript | Mobile-first PWA, Server-Side Rendering (SSR) & SPA |
| **Styling** | Vanilla CSS Variables + Tailwind | Ringan, konsisten dengan GowesKit Design System |
| **Backend API** | Fastify, TypeScript Strict | High-performance async REST API, validasi input Zod |
| **Database & GIS** | PostgreSQL 16+ / 18, PostGIS | Relational schema dengan query spasial `ST_DWithin` |
| **ORM & Migrations** | Drizzle ORM | Type-safe SQL migrations & schema definitions |
| **Monorepo** | pnpm workspaces | Manajemen modul independen & efisien |
| **Maps** | MapLibre GL JS, OpenFreeMap | Peta vektor open-source tanpa vendor lock-in |
| **Testing** | Vitest | 79 file pengujian otomatis dengan cakupan unit & integrasi |

---

## 🚀 Panduan Menjalankan Secara Lokal (Quick Start)

### Persyaratan Sistem:
* **Node.js**: `v22.0.0` atau lebih baru
* **pnpm**: `v10.0.0` atau lebih baru (`npm install -g pnpm`)
* **PostgreSQL**: `v16+` / `v18` dengan ekstensi **PostGIS** aktif

### 1. Instalasi PostgreSQL & PostGIS (macOS Homebrew)
```bash
# Install PostgreSQL dan ekstensi PostGIS
brew install postgresql@18 postgis
brew services start postgresql@18

# Buat database lokal
createdb -h localhost -U $(whoami) goweskit
```

*(Opsi Alternatif: Gunakan Docker)*
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Kloning Repositori & Setup Environment
```bash
# Clone repository
git clone https://github.com/RiprLutuk/goweskit.git
cd goweskit

# Siapkan file environment
cp .env.example .env

# Install seluruh dependensi monorepo
pnpm install
```

### 3. Eksekusi Migrasi Database & Seeding Data
```bash
# Jalankan migrasi skema database
pnpm db:migrate

# Isi database dengan standar sepeda resmi, glosarium, rute demo, dan komunitas
pnpm db:seed
```

### 4. Jalankan Server Pengembangan
```bash
pnpm dev
```
* **Aplikasi Web**: [http://localhost:3000](http://localhost:3000) (atau port 3001)
* **Backend API**: [http://localhost:4000](http://localhost:4000) (atau port 4001)

**Kredensial Akun Demo:**
* **Email**: `demo@goweskit.local`
* **Password**: `GowesKitDemo123!`

---

## 🚢 Panduan Deployment ke Production (VPS / Cloud)

### Opsi 1: Deployment Otomatis via Docker Compose (Direkomendasikan)

1. **Siapkan Server VPS** (Ubuntu 22.04 / 24.04 LTS).
2. **Pasang Docker & Docker Compose**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   ```
3. **Kloning & Konfigurasi `.env`**:
   ```bash
   git clone https://github.com/RiprLutuk/goweskit.git /var/www/goweskit
   cd /var/www/goweskit
   cp .env.example .env
   nano .env # Masukkan domain dan kredensial database produksi
   ```
4. **Build dan Jalankan Container**:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d --build
   ```
5. **Jalankan Migrasi Skema di Container**:
   ```bash
   docker compose -f infra/docker-compose.prod.yml exec api pnpm db:migrate
   docker compose -f infra/docker-compose.prod.yml exec api pnpm db:seed
   ```

---

### Opsi 2: Deployment Native dengan PM2 & Nginx Reverse Proxy

1. **Build Monorepo**:
   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   ```

2. **Jalankan Proses dengan PM2**:
   ```bash
   npm install -g pm2
   
   # Jalankan Fastify Backend API
   pm2 start apps/api/dist/index.js --name "goweskit-api" --env PORT=4000
   
   # Jalankan Nuxt 3 Frontend Web
   pm2 start apps/web/.output/server/index.mjs --name "goweskit-web" --env PORT=3000
   
   pm2 save
   pm2 startup
   ```

3. **Konfigurasi Nginx** (`/etc/nginx/sites-available/goweskit`):
   ```nginx
   server {
       listen 80;
       server_name goweskit.id www.goweskit.id;

       # Nuxt 3 Frontend
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Fastify REST API
       location /api/ {
           proxy_pass http://127.0.0.1:4000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Aktifkan Sertifikat SSL Gratis (Let's Encrypt)**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/goweskit /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d goweskit.id -d www.goweskit.id
   ```

---

## 🧪 Quality Gates & Pengujian

Sebelum melakukan commit, pastikan seluruh quality gate lulus:

```bash
# 1. Format & Linting Check
pnpm lint
pnpm format:check

# 2. TypeScript Strict Typecheck (Semua package & apps)
pnpm typecheck

# 3. Jalankan Seluruh Test Suite (Vitest)
pnpm test
```

---

## 💖 Dukung Pengembangan GowesKit (Donasi)

GowesKit dikembangkan secara independen dengan semangat *open-source* untuk memajukan kultur pesepeda di tanah air. Jika aplikasi ini membantu Anda dalam merawat sepeda, menemukan jalur baru, atau merencanakan upgrade suku cadang, Anda dapat memberikan apresiasi berupa donasi untuk mendukung biaya server dan riset suku cadang berikutnya! ☕🚴

> ⚠️ **Catatan Penting**: Donasi hanya dapat dipindai langsung melalui aplikasi **GoPay**.

<div align="center">
  <br />
  <a href="https://github.com/RiprLutuk/PasPapan/blob/main-vps/screenshots/donation-qr.jpeg" target="_blank" rel="noopener noreferrer">
    <img 
      src="https://raw.githubusercontent.com/RiprLutuk/PasPapan/main-vps/screenshots/donation-qr.jpeg" 
      alt="Donasi GowesKit via GoPay" 
      width="280" 
      style="border-radius: 16px; border: 2px solid #C9F36A; box-shadow: 0 12px 32px rgba(0,0,0,0.35);" 
    />
  </a>
  <br /><br />
  <p><strong>📱 Scan QR di atas langsung menggunakan Aplikasi GoPay</strong></p>
  <p><em>Terima kasih banyak atas dukungan goweser semua! Salam satu aspal, satu tanah! 🚲💨</em></p>
</div>

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah naungan Lisensi **MIT**. Lihat file `LICENSE` untuk rincian selengkapnya.

