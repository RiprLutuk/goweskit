<div align="center">

# 🚴 GowesKit
### Platform Cerdas, Paspor Sepeda Digital & Ekosistem Pesepeda

[![Live Demo](https://img.shields.io/badge/Live_Demo-goweskit.demo.pandanteknik.com-00DC82?style=flat-square&logo=google-chrome&logoColor=white)](https://goweskit.demo.pandanteknik.com/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%20v5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Nuxt 4 / Vue 3](https://img.shields.io/badge/Nuxt_4-Vue_3.5-00DC82?style=flat-square&logo=nuxtdotjs&logoColor=white)](https://nuxt.com/)
[![Fastify](https://img.shields.io/badge/Fastify-v5-000000?style=flat-square&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![PostGIS Spasial](https://img.shields.io/badge/PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Tests Passing](https://img.shields.io/badge/Tests-340+%20passed%20%7C%20100%25-brightgreen?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Privasi UU PDP](https://img.shields.io/badge/UU_PDP-AES--256--CBC-blueviolet?style=flat-square&logo=shield)](https://indonesia.go.id/)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<p align="center">
  Platform all-in-one pesepeda: <strong>Paspor Sepeda Digital</strong> dengan stiker QR frame anti-curanmor, <strong>Upgrade Lab</strong> deterministik berbasis standar baku industri, <strong>Navigasi Spasial PostGIS</strong> &amp; <strong>Offline Tile Cache</strong>, <strong>Ride Safety Beacon</strong> dengan Screen WakeLock, serta <strong>Ride Flex AI Studio</strong> bertenaga Google Gemini.
</p>

<br />

<p align="center">
  <a href="https://goweskit.demo.pandanteknik.com/">
    <img src="./docs/screenshots/hero-banner.png" alt="GowesKit App Hero Mockup" width="100%" style="border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.35);" />
  </a>
</p>

<br />

[Live Demo](https://goweskit.demo.pandanteknik.com/) •
[Preview Visual](#-preview-tampilan-aplikasi) •
[Fitur Unggulan](#-fitur-unggulan) •
[Arsitektur Sistem](#-arsitektur-sistem--monorepo) •
[Standar Baku Industri](#-standar-baku-industri-resmi) •
[Quick Start](#-panduan-menjalankan-secara-lokal-quick-start) •
[Panduan Deployment](#-panduan-deployment-ke-production-vps--cloud) •
[Dukungan Donasi](#-dukung-pengembangan-goweskit-donasi)

</div>

---

## 📸 Preview Tampilan Aplikasi

<div align="center">

| Beranda & Cuaca Realtime | Navigasi & Pitstop Spasial | Anatomi & Standar Sepeda |
| :---: | :---: | :---: |
| <img src="./docs/screenshots/mockup-01-home.png" width="260" alt="Beranda GowesKit" /> | <img src="./docs/screenshots/mockup-02-explore.png" width="260" alt="Explore Map PostGIS" /> | <img src="./docs/screenshots/mockup-03-learn.png" width="260" alt="Learn Center Standar Sepeda" /> |
| **Garasi & Paspor Sepeda** | **Jadwal Mabar Komunitas** | **Profil Rider & Privasi PDP** |
| <img src="./docs/screenshots/mockup-04-garage.png" width="260" alt="My Garage & Paspor Sepeda" /> | <img src="./docs/screenshots/mockup-06-community.png" width="260" alt="Komunitas & Jadwal Mabar" /> | <img src="./docs/screenshots/mockup-05-profile.png" width="260" alt="Pengaturan & Profil Rider" /> |

</div>

---

## 🌟 Fitur Unggulan

### 1. 📱 Paspor Sepeda Digital & Cetak Stiker QR Frame (`/garage` & `/bikes/:id/passport`)
* **Sertifikat Kepemilikan Digital**: Bukti sah kepemilikan unit sepeda dengan nomor seri unik (*Passport UID*), catatan spesifikasi pabrik, dan status verifikasi anti-curanmor.
* **Cetak Stiker QR Frame Presisi**: Ekspor stiker *top tube / down tube* dalam format **PNG High-Res 300 DPI** dan **Vektor SVG**. Siapa pun yang memindai QR code di frame sepeda dapat langsung melihat paspor digital publik tanpa perlu login.
* **Health Badge & Odometer**: Pemantauan kilometer tempuh dan status keausan komponen secara real-time.

### 2. 🔬 Upgrade Lab & Checklist Belanja Part (`/upgrade-lab`)
* **Deterministic Compatibility Engine**: Uji kecocokan suku cadang baru (*Bottom Bracket, Thru-Axle, Freehub, Brake Mount, Headset, Seatpost, Fork Travel*) berdasarkan data dimensi mekanis riil, bukan tebak-tebakan merek.
* **Estimasi Biaya & Tier Budget**: Kalkulasi estimasi harga suku cadang berdasarkan tier *Ekonomis, Enthusiast, Pro Spec*, serta estimasi ongkos jasa pasang bengkel.
* **Checklist Belanja & Bengkel**: Daftar perlengkapan part & perkakas mekanik (*Torque Wrench, Chain Whip, BB Tool*) yang dapat dicentang dan disalin ke format pesan WhatsApp toko sepeda.

### 3. 🗺️ Explore Rute & Grafik Elevasi Interaktif (`/explore`)
* **Pencarian Spasial PostGIS Privacy-First**: Temukan rute gowes, bengkel, toko sepeda, pitstop kopi, *water refill*, dan *trailhead* dalam radius tertentu tanpa mempublikasikan koordinat pribadi Anda.
* **Grafik Profil Elevasi & Gradien**: Visualisasi interaktif kontur ketinggian rute dengan deteksi kategori tanjakan (*Cat 1, Cat 2, Cat 3, Cat 4, HC*), sudut elevasi maksimal (% Grade), serta *interactive scrubbing cursor*.
* **Deep Link Navigasi**: Buka koordinat langsung di Google Maps atau Komoot dengan 1 klik.

### 4. 📴 Offline Vector Tile Map Caching (`/safety` & `/explore`)
* **Navigasi Zero-Signal**: Simpan tile peta OpenStreetMap lokal ke dalam `CacheStorage` browser sebelum memulai gowes ke pelosok atau jalur perbukitan tanpa sinyal internet.
* **Pengelola Kuota Cache**: Monitor pemakaian memori perangkat (MB & jumlah tile) dan bersihkan cache kapan saja.

### 5. 🛡️ Ride Safety Beacon & Continuous GPS (`/safety`)
* **Live GPS Tracking & Screen WakeLock**: Mencegah layar ponsel mati saat dipasang pada *handlebar mount* sepeda.
* **Privat & Terenkripsi**: Tautan pemantauan sementara berbasis token acak *high-entropy* yang hanya dapat diakses oleh kontak darurat pilihan Anda.
* **Ekspor GPX Otomatis**: Rekam dan unduh file rekam jejak `.gpx` kompatibel dengan Garmin, Strava, dan Wahoo.

### 6. 🎨 Ride Flex Studio AI (`/ride-flex`)
* **Multimodal AI Poster Generator (Gemini 2.5)**: Analisis foto gowes dan telemetri otomatis untuk membuat poster Instagram Story (9:16), Feed Post (1:1), atau Banner (16:9).
* **4 Persona AI Caption**: Pilihan gaya caption bertema *Peloton Pro, Komuter Santai, Tech Geek*, dan *Santai Kulineran*.
* **Tarik Jejak GPX & Solo Breadcrumb**: Impor file `.gpx` dari perangkat mana pun untuk memproyeksikan rute glowing SVG di atas foto.

### 7. 🔐 Kepatuhan Privasi UU PDP & Keamanan Data (`/me`)
* **Enkripsi Database AES-256-CBC**: Data sensitif pribadi (*nomor WhatsApp kontak darurat, email*) dienkripsi di level database PostgreSQL.
* **Hak Portabilitas Data (GDPR / UU PDP)**: Pengguna dapat mengunduh seluruh salinan data akun dan riwayat gowes dalam format file JSON terstruktur.

---

## 🏗️ Arsitektur Sistem & Monorepo

```text
                               ┌───────────────────────────────┐
                               │       GOWESKIT MONOREPO       │
                               │        (pnpm workspaces)      │
                               └───────────────┬───────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
   ┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
   │    apps/web (Nuxt 4)  │       │  packages/bike-domain │       │  packages/contracts   │
   │  - Vue 3.5 + Vite     │       │  - Deterministic Rules│       │  - Zod Schemas        │
   │  - PWA Offline Cache  │       │  - Standards Registry │       │  - Type-safe REST DTO │
   │  - Pure TS QR Engine  │       │  - Tooling Catalog    │       │  - Shared Interfaces  │
   │  - Interactive Charts │       └───────────────────────┘       └───────────────────────┘
   └───────────┬───────────┘                   │                               │
               │                               └───────────────┬───────────────┘
               │                                               │
               │                   ┌───────────────────────────▼───┐
               └──────────────────►│       apps/api (Fastify)      │
                                   │  - TypeScript Strict Engine   │
                                   │  - AES-256-CBC PII Encryption │
                                   │  - Google Gemini 2.5 Client   │
                                   └───────────────┬───────────────┘
                                                   │
                                   ┌───────────────▼───────────────┐
                                   │    PostgreSQL 16+ / PostGIS   │
                                   │  - Drizzle ORM Type-Safe SQL  │
                                   │  - Spatial ST_DWithin Index   │
                                   └───────────────────────────────┘
```

---

## 📐 Standar Baku Industri Resmi

GowesKit tidak menggunakan asumsi merek melainkan merujuk langsung pada spesifikasi teknis baku manufaktur sepeda:

1. **ISO 5775-1 / ISO 4210**: Standar diameter lingkar velg ETRTO/BSD (622mm / 700C, 584mm / 650B, 406mm / 451mm) dan keselamatan geometri rangka.
2. **SHIS (Standardized Headset Identification System)**: Standar identifikasi headset Cane Creek, Park Tool, dan FSA (EC, ZS, IS).
3. **Park Tool & Sram/Shimano BB Standards**: Standar ulir (BSA, Italian, T47) dan PressFit (BB86, BB92, PF30, BB30, DUB 28.99mm, 24mm Spindle, 30mm Spindle).
4. **SRAM UDH & Freehub Matrix**: Standar Universal Derailleur Hanger, Shimano Micro Spline, SRAM XD/XDR, dan HG Classic.

---

## 💻 Panduan Menjalankan Secara Lokal (Quick Start)

### Persyaratan Sistem:
* **Node.js**: `v22.0.0` atau lebih baru
* **pnpm**: `v10.0.0` atau lebih baru (`npm install -g pnpm`)
* **PostgreSQL**: `v16+` / `v18` dengan ekstensi **PostGIS** aktif

### 1. Instalasi PostgreSQL & PostGIS (macOS Homebrew)
```bash
brew install postgresql@18 postgis
brew services start postgresql@18
createdb -h localhost -U $(whoami) goweskit
```

*(Atau via Docker)*
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Kloning & Install Dependencies
```bash
git clone https://github.com/RiprLutuk/goweskit.git
cd goweskit
cp .env.example .env
pnpm install
```

### 3. Migrasi & Seeding Database
```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Jalankan Development Server
```bash
pnpm dev
```
* **Frontend Web**: [http://localhost:3001](http://localhost:3001)
* **Backend API**: [http://localhost:4001](http://localhost:4001)

**Akun Demo:**
* **Email**: `demo@goweskit.local`
* **Password**: `GowesKitDemo123!`

---

## 🚀 Panduan Deployment ke Production (VPS / Cloud)

### Opsi 1: Deployment via PM2 & Nginx Reverse Proxy (Direkomendasikan)

1. **Build Seluruh Monorepo**:
   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   ```

2. **Jalankan Proses Background dengan PM2**:
   ```bash
   npm install -g pm2
   pm2 start apps/api/dist/index.js --name "goweskit-api" --env PORT=4000
   pm2 start apps/web/.output/server/index.mjs --name "goweskit-web" --env PORT=3000
   pm2 save
   pm2 startup
   ```

3. **Konfigurasi Nginx** (`/etc/nginx/sites-available/goweskit`):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

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

4. **Aktifkan Sertifikat SSL (HTTPS)**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/goweskit /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🧪 Quality Gates & Uji Otomatis

```bash
# 1. Validasi Kode & Linter
pnpm lint
pnpm format:check

# 2. TypeScript Strict Typecheck (5 Proyek)
pnpm typecheck

# 3. Jalankan 340+ Automated Unit & Contract Tests
pnpm test
```

---

## ☕ Dukung Pengembangan GowesKit (Donasi)

GowesKit dikembangkan secara independen dan *open-source* untuk memajukan kultur pesepeda dan literasi teknis perawatan sepeda di Indonesia. Jika aplikasi ini bermanfaat untuk perawatan sepeda, eksplorasi rute, dan keselamatan solo ride Anda, Anda dapat memberikan apresiasi donasi untuk mendukung pemeliharaan server dan riset suku cadang.

> **Catatan**: Donasi dapat dipindai secara langsung melalui aplikasi **GoPay**.

<div align="center">
  <br />
  <a href="https://github.com/RiprLutuk/PasPapan/blob/main-vps/screenshots/donation-qr.jpeg" target="_blank" rel="noopener noreferrer">
    <img 
      src="./docs/donation-qr.jpeg" 
      alt="Donasi GowesKit via GoPay" 
      width="280" 
      style="border-radius: 16px; border: 2px solid #C9F36A; box-shadow: 0 12px 32px rgba(0,0,0,0.35);" 
    />
  </a>
  <br /><br />
  <p><strong>Scan QR di atas langsung menggunakan Aplikasi GoPay</strong></p>
  <p><a href="https://github.com/RiprLutuk/PasPapan/blob/main-vps/screenshots/donation-qr.jpeg" target="_blank">Lihat Gambar Asli QR GoPay (PasPapan Repository)</a></p>
</div>

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi **MIT**. Lihat file [`LICENSE`](file:///Users/lutuk/Project/learning/goweskit-starter/LICENSE) untuk informasi selengkapnya.
