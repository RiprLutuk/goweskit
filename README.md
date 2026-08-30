# GowesKit 🚲⚡ — Platform Cerdas & Sahabat Pesepeda Indonesia

> **"Bukan sekadar gowes, pahami sepedamu luar-dalam!"**
> Platform edukasi, manajemen sepeda (Garage), cek kompatibilitas suku cadang deterministik (Upgrade Lab), jelajah rute & pitstop (Explore), jadwal mabar komunitas, pemantau servis berkala, solo-ride safety token, hingga studio flex AI.

---

## 🌟 Mengapa GowesKit?

Pesepeda sering bingung saat mau upgrade parts sepeda:
* *"Apakah groupset 12-speed ini muat di freehub HG saya?"*
* *"Fork tapered ini bisa masuk ke headtube straight saya tanpa ganti headset?"*
* *"Berapa tekanan ban dan interval servis rantai yang tepat?"*

**GowesKit** hadir memecahkan masalah tersebut dengan **100% Deterministic Compatibility Engine** berlandaskan standar industri resmi internasional (ISO, SHIS, Park Tool, Shimano/SRAM), tanpa tebak-tebakan atau klaim sepihak.

---

## 🚲 Fitur Utama & Modul GowesKit

### 1. 📚 Learn Center & Glosarium Standar Resmi
* **Anatomi & Standar Sepeda**: Panduan detail untuk Road Bike, MTB Hardtail, Folding Bike, dan Gravel Bike.
* **Transparansi Standar Resmi**: Dilengkapi tautan rujukan resmi ke **ISO 5775-1 / ISO 4210**, **SHIS (Standardized Headset Identification System)**, **Park Tool BB Guide**, dan **Matriks Kompatibilitas Shimano/SRAM**.
* **Pencarian Cepat & Filter Standar**: Glosarium interaktif untuk memahami istilah teknis (Thru-Axle, Boost 148, DUB, BB30, UDH, dll).

### 2. 🛠️ My Garage & Paspor Sepeda
* **Inventaris Sepeda**: Simpan spek lengkap mulai dari wheelset, bottom bracket, headset, groupset, hingga rem.
* **Explicit Unknown Tracking**: Jika ada standar sepeda yang belum diketahui, sistem menandainya sebagai `Unknown` dan membimbing cara mengukurnya secara tepat.
* **Paspor Sepeda Interaktif**: Ringkasan spek siap share dan audit cepat saat ke bengkel.

### 3. 🧪 Upgrade Lab (Mesin Kompatibilitas Deterministik)
* **Cek Kompatibilitas Instan**: Pilih sepeda di Garage dan pilih suku cadang impian (misal: Cassette 12-speed Micro Spline, Wheelset Thru-Axle 12x142, Fork Tapered 1.5").
* **Hasil Evaluasi Jelas**:
  * ✅ **Compatible** — Plug & play sesuai standar resmi.
  * ⚠️ **Conditional** — Butuh adaptor atau spacer khusus.
  * ❌ **Incompatible** — Tidak muat secara fisik/mekanik.
  * ❓ **Unknown Specs** — Butuh konfirmasi spek eksisting.
* **Kotak Provenance**: Menampilkan nomor aturan, versi, dan standar rujukan resmi untuk tiap evaluasi.

### 4. 🗺️ Explore & Rute Gowes
* **Peta Interaktif Privasi Terjaga**: Cari bengkel sepeda, toko sparepart, titik pitstop kopi, minimarket, water station, dan jalur gowes terdekat.
* **Pencarian Berbasis Radius PostGIS**: Privasi pesepeda terlindungi — koordinat lokasi pengguna tidak pernah disimpan atau dipublikasikan ke publik.
* **Mode Offline & OpenFreeMap**: Navigasi tetap aman meski sinyal seluler hilang di jalur gravel.

### 5. 👥 Komunitas & Jadwal Mabar
* **Temukan Komunitas Lokal**: Gabung ke klub pesepeda kota Anda (Road, MTB, Gravel, Foldie).
* **Jadwal Gowes Bareng (Mabar)**: Detail titik kumpul (meeting point), elevasi, rute, dan tingkat pace/kecepatan.
* **Status Keanggotaan Rapi**: Manajemen anggota, reminder mabar, dan integrasi pendaftaran instan.

### 6. 🛡️ Ride Safety (Solo-Ride Tracker & SOS)
* **High-Entropy Expiring Share Token**: Bagikan tautan pelacakan langsung sementara ke kontak tepercaya (*trusted contacts*).
* **Sesi Otomatis Berbatas Waktu**: Tidak ada pelacakan tersembunyi di latar belakang.
* **Kontrol Penuh**: Akhiri atau cabut izin akses pelacakan kapan saja dengan satu sentuhan.

### 7. 🔧 Maintenance & Catatan Servis
* **Service Interval Tracker**: Pengingat berkala untuk lubrikasi rantai, cek brake pad, bleeding rem hidrolik, hingga servis suspensi/fork.
* **Riwayat Servis**: Dokumentasi perawatan dan histori bengkel untuk menjaga performa sepeda tetap prima.

### 8. 📸 Ride Flex Studio AI
* **Poster Generator Estetik**: Ubah data sesi gowes menjadi karya visual modern untuk Instagram Story (9:16), Post Feed (1:1), atau Widescreen (16:9).
* **4 Gaya Tema Premium**: *Strava Bold (High Contrast)*, *Rapha Editorial (Serif Timeless)*, *Cyber HUD (Neon Tech)*, dan *Cafe Santai (Warm Recovery)*.
* **Artwork Rute GPS & Spektrum Elevasi**: Visualisasi jalur GPS dengan glowing track dan waypoint pitstop kopi.
* **Caption Generator AI**: Buat caption menarik dalam berbagai persona (*Peloton Pro*, *Anak Senoparty*, *Mekanik Senior*, *Komuter Santai*).

---

## 💻 Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend Web** | Nuxt 3, Vue 3, TypeScript Strict, Tailwind CSS / Vanilla CSS Variables |
| **Backend API** | Fastify, TypeScript Strict, Drizzle ORM |
| **Database & GIS** | PostgreSQL 16+ / 18 dengan ekstensi **PostGIS** |
| **Monorepo** | pnpm workspaces |
| **Shared Contracts** | Zod (`packages/contracts`) |
| **Domain Logic** | 100% Pure TypeScript Rules (`packages/bike-domain`) |
| **Maps & Geospatial** | MapLibre GL, OpenFreeMap Tiles |
| **Testing** | Vitest (79 test files, 100% passing quality gate) |

---

## 🚀 Panduan Menjalankan Secara Lokal (Local Development)

### Kebutuhan Sistem:
* **Node.js**: v22+
* **pnpm**: v10+ (`npm install -g pnpm`)
* **PostgreSQL** dengan ekstensi **PostGIS**

### 1. Setup PostgreSQL & PostGIS (macOS / Homebrew)
```bash
# Install PostgreSQL dan PostGIS
brew install postgresql@18 postgis
brew services start postgresql@18

# Buat database goweskit
createdb -h localhost -U $(whoami) goweskit
```

*(Alternatif: Gunakan Docker Compose untuk database)*
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Install Dependensi & Konfigurasi Environment
```bash
# Clone repository
git clone https://github.com/RiprLutuk/goweskit.git
cd goweskit

# Copy file environment
cp .env.example .env

# Install seluruh paket monorepo
pnpm install
```

### 3. Migrasi Database & Seeding Data
```bash
# Jalankan migrasi skema Drizzle & PostGIS
pnpm db:migrate

# Isi database dengan data standar sepeda, glosarium, rute demo, & komunitas
pnpm db:seed
```

### 4. Jalankan Server Development
```bash
pnpm dev
```
Aplikasi web akan aktif di `http://localhost:3000` dan API di `http://localhost:4000`.

**Akun Demo:**
* **Email**: `demo@goweskit.local`
* **Password**: `GowesKitDemo123!`

---

## 🚢 Panduan Deploy ke Production (VPS / Cloud)

### Opsi A: Deployment Menggunakan Docker & Docker Compose (Direkomendasikan)

1. **Siapkan Server VPS** (Ubuntu 22.04 / 24.04 LTS).
2. **Install Docker & Docker Compose Plugin**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin
   ```
3. **Clone Repository & Konfigurasi `.env`**:
   ```bash
   git clone https://github.com/RiprLutuk/goweskit.git /var/www/goweskit
   cd /var/www/goweskit
   cp .env.example .env
   # Edit .env dengan kredensial produksi dan domain Anda
   nano .env
   ```
4. **Build & Jalankan Container**:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d --build
   ```
5. **Jalankan Migrasi Skema di Container**:
   ```bash
   docker compose -f infra/docker-compose.prod.yml exec api pnpm db:migrate
   docker compose -f infra/docker-compose.prod.yml exec api pnpm db:seed
   ```

---

### Opsi B: Deployment Native dengan PM2 & Nginx Reverse Proxy

1. **Build Monorepo**:
   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   ```

2. **Jalankan Aplikasi Menggunakan PM2**:
   ```bash
   npm install -g pm2
   
   # Jalankan Fastify API
   pm2 start apps/api/dist/index.js --name "goweskit-api" --env PORT=4000
   
   # Jalankan Nuxt Web
   pm2 start apps/web/.output/server/index.mjs --name "goweskit-web" --env PORT=3000
   
   pm2 save
   pm2 startup
   ```

3. **Konfigurasi Nginx Reverse Proxy** (`/etc/nginx/sites-available/goweskit`):
   ```nginx
   server {
       listen 80;
       server_name goweskit.id www.goweskit.id;

       # Frontend Web (Nuxt 3)
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API (Fastify)
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

4. **Aktifkan SSL Gratis dengan Certbot**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/goweskit /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d goweskit.id -d www.goweskit.id
   ```

---

## 🧪 Pengujian & Quality Gates

Setiap perubahan kode wajib melalui quality gate:

```bash
# Cek format & lint
pnpm lint
pnpm format:check

# TypeScript typecheck
pnpm typecheck

# Jalankan seluruh test suite (Web, API, Contracts, Domain)
pnpm test
```

---

## 💖 Dukung Pengembangan GowesKit (Donasi)

Jika aplikasi ini bermanfaat untuk hobi gowes dan perawatan sepeda Anda, dukung developer untuk biaya server dan riset suku cadang sepeda berikutnya! ☕🚴

> ⚠️ **Catatan Penting**: Donasi hanya dapat dipindai langsung melalui aplikasi **GoPay**.

<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/RiprLutuk/PasPapan/main-vps/screenshots/donation-qr.jpeg" alt="Donasi via GoPay" width="280" style="border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
  <br />
  <p><strong>Scan QR di atas langsung dari Aplikasi GoPay</strong></p>
  <p><em>Terima kasih banyak atas dukungan goweser semua! Salam satu aspal, satu tanah! 🚲💨</em></p>
</div>

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.
