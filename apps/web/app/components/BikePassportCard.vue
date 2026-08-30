<script setup lang="ts">
import QRCode from 'qrcode';
import type { Bike } from '@goweskit/contracts';

const props = defineProps<{
  bike: Bike;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { toast } = useNotify();
const qrDataUrl = ref<string>('');
const isPrinting = ref(false);
const activeFormat = ref<'story' | 'post' | 'sheet'>('story');
const isGeneratingImage = ref(false);

const fullBikeTitle = computed(() => {
  const parts = [
    props.bike.brand,
    props.bike.model,
    props.bike.modelYear ? String(props.bike.modelYear) : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : props.bike.nickname;
});

const knownSpecsCount = computed(() => {
  return props.bike.specs?.filter((s) => s.knowledge === 'known').length ?? 0;
});

const totalSpecsCount = computed(() => props.bike.specs?.length ?? 0);

function bikeTypeSvg(slug: string): string {
  const map: Record<string, string> = {
    folding: '/bikes/folding.svg',
    gravel: '/bikes/gravel.svg',
    mtb_hardtail: '/bikes/mtb_hardtail.svg',
    road: '/bikes/road.svg',
  };
  return map[slug] ?? '/bikes/mtb_hardtail.svg';
}

async function generateQrCode() {
  if (typeof window === 'undefined') return;
  try {
    const currentUrl = window.location.href;
    qrDataUrl.value = await QRCode.toDataURL(currentUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#17202A',
        light: '#FFFFFF',
      },
    });
  } catch (err: unknown) {
    console.error('Failed to generate QR code:', err);
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      void generateQrCode();
    }
  },
  { immediate: true },
);

function handlePrint() {
  isPrinting.value = true;
  setTimeout(() => {
    window.print();
    isPrinting.value = false;
  }, 150);
}

async function copySpecSummary() {
  const specsText =
    props.bike.specs
      ?.map(
        (s) =>
          `• ${s.label}: ${s.valueLabel ?? s.value ?? 'Unknown'} [${s.knowledge}]`,
      )
      .join('\n') ?? 'Belum ada spek.';

  const summary = `🚲 PASPOR SEPEDA GOWESKIT
━━━━━━━━━━━━━━━━━━━━
🚴 Nama: ${props.bike.nickname}
🏷️ Model: ${fullBikeTitle.value}
⚡ Tipe: ${props.bike.bicycleType.name}
✓ Standar Terverifikasi: ${String(knownSpecsCount.value)}/${String(totalSpecsCount.value)}

📋 Komponen & Standar Dimensi:
${specsText}

🔗 Cek anatomi & buku servis digital: ${window.location.href}
#GowesKit #BikePassport #CyclingSpecs #${props.bike.bicycleType.slug}`;

  try {
    await navigator.clipboard.writeText(summary);
    toast.success(
      'Caption & Spek Disalin!',
      'Siap ditempel ke Instagram, WhatsApp, atau kirim ke mekanik.',
    );
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

// Draw HD Story / Post card on canvas for download & native share
async function renderCanvas(format: 'story' | 'post'): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const isStory = format === 'story';
  canvas.width = 1080;
  canvas.height = isStory ? 1920 : 1080;

  // 1. Dark asphalt background
  ctx.fillStyle = '#17202A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Subtle cyber blueprint grid
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.05)';
  ctx.lineWidth = 2;
  const gridSize = 60;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 3. Header Card / Brand
  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('GOWESKIT · OFFICIAL BIKE PASSPORT', 80, isStory ? 120 : 90);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '28px sans-serif';
  ctx.fillText(`ID: ${props.bike.id.slice(0, 12)}`, canvas.width - 320, isStory ? 120 : 90);

  // 4. Nickname & Model
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 64px sans-serif';
  ctx.fillText(props.bike.nickname, 80, isStory ? 240 : 180);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 36px sans-serif';
  ctx.fillText(fullBikeTitle.value, 80, isStory ? 300 : 230);

  // 5. Type & Verified Badge Pills
  ctx.fillStyle = '#C9F36A';
  ctx.beginPath();
  ctx.roundRect(80, isStory ? 350 : 270, 320, 60, 30);
  ctx.fill();

  ctx.fillStyle = '#17202A';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(props.bike.bicycleType.name.toUpperCase(), 110, isStory ? 392 : 312);

  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.roundRect(420, isStory ? 350 : 270, 440, 60, 30);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`✓ ${knownSpecsCount.value}/${totalSpecsCount.value} SPECS VERIFIED`, 450, isStory ? 392 : 312);

  // 6. Draw Bike Photo or Artwork if available
  const imgBoxY = isStory ? 460 : 360;
  const imgBoxHeight = isStory ? 600 : 380;
  const imgBoxWidth = canvas.width - 160;

  // Background frame
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(80, imgBoxY, imgBoxWidth, imgBoxHeight, 28);
  ctx.fill();
  ctx.stroke();

  // Try to draw bike image
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const imgSrc = props.bike.photoUrl || bikeTypeSvg(props.bike.bicycleType.slug);
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // don't crash if image fails
      img.src = imgSrc;
    });
    if (img.width > 0) {
      const padding = 40;
      const drawW = imgBoxWidth - padding * 2;
      const drawH = imgBoxHeight - padding * 2;
      ctx.drawImage(img, 80 + padding, imgBoxY + padding, drawW, drawH);
    }
  } catch (e) {
    console.warn('Canvas photo draw error:', e);
  }

  // 7. Verified Specs Grid
  const specsY = isStory ? 1120 : 770;
  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('STANDAR KOMPONEN TERVERIFIKASI', 80, specsY);

  const keySpecs = props.bike.specs?.filter((s) => s.knowledge === 'known').slice(0, 6) ?? [];
  const startCardY = specsY + 30;
  const cardW = (canvas.width - 160 - 30) / 2;
  const cardH = isStory ? 100 : 70;

  keySpecs.forEach((spec, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 80 + col * (cardW + 30);
    const y = startCardY + row * (cardH + 20);

    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(spec.label.toUpperCase(), x + 20, y + (isStory ? 40 : 30));

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    const valText = spec.valueLabel ?? spec.value ?? '-';
    ctx.fillText(valText.length > 22 ? valText.slice(0, 22) + '…' : valText, x + 20, y + (isStory ? 75 : 58));
  });

  // 8. Bottom Footer with QR code (Story mode)
  if (isStory && qrDataUrl.value) {
    try {
      const qrImg = new Image();
      await new Promise((resolve) => {
        qrImg.onload = resolve;
        qrImg.onerror = resolve;
        qrImg.src = qrDataUrl.value;
      });
      ctx.drawImage(qrImg, 80, 1600, 180, 180);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('PINDAI UNTUK ANATOMI LENGKAP', 290, 1660);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '26px sans-serif';
      ctx.fillText('Diverifikasi dengan aturan deterministik GowesKit', 290, 1710);
      ctx.fillText('goweskit.id · My Garage Workshop', 290, 1755);
    } catch {
      // ignore qr draw fallback
    }
  }

  // Watermark stamp
  ctx.fillStyle = 'rgba(201, 243, 106, 0.8)';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('⚡ POWERED BY GOWESKIT', isStory ? canvas.width - 420 : canvas.width - 380, canvas.height - 40);

  return canvas;
}

async function downloadStoryImage() {
  isGeneratingImage.value = true;
  try {
    const canvas = await renderCanvas(activeFormat.value === 'post' ? 'post' : 'story');
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Blob creation failed');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const formatName = activeFormat.value === 'post' ? 'Post_1x1' : 'Story_9x16';
    link.download = `${props.bike.nickname.replaceAll(' ', '_')}_GowesKit_${formatName}.png`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Poster HD Terunduh!', 'Format pas untuk Instagram Story / WhatsApp Status.');
  } catch (err: unknown) {
    console.error('Download error:', err);
    toast.error('Gagal mengunduh poster', 'Silakan gunakan tombol salin spek.');
  } finally {
    isGeneratingImage.value = false;
  }
}

async function shareToMedia() {
  isGeneratingImage.value = true;
  try {
    const canvas = await renderCanvas(activeFormat.value === 'post' ? 'post' : 'story');
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Blob creation failed');

    const file = new File(
      [blob],
      `${props.bike.nickname.replaceAll(' ', '_')}_Passport.png`,
      { type: 'image/png' },
    );

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Paspor Sepeda ${props.bike.nickname}`,
        text: `Cek identitas dan standar spesifikasi ${props.bike.nickname} di GowesKit!`,
      });
      toast.success('Berhasil Dibagikan!', 'Paspor sepeda siap diposting ke media sosial.');
    } else if (navigator.share) {
      await navigator.share({
        title: `Paspor Sepeda ${props.bike.nickname}`,
        text: `Cek identitas dan standar spesifikasi ${props.bike.nickname} di GowesKit!`,
        url: window.location.href,
      });
      toast.success('Tautan Dibagikan!', 'Tautan paspor garasi telah dibuka.');
    } else {
      await copySpecSummary();
    }
  } catch (err: unknown) {
    // User cancelled share dialog is normal
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('Share error:', err);
      await copySpecSummary();
    }
  } finally {
    isGeneratingImage.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="passport-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-title"
      @click.self="emit('close')"
    >
      <div class="passport-modal">
        <!-- Close Button -->
        <button
          type="button"
          class="passport-close-btn"
          aria-label="Tutup Kartu Paspor"
          @click="emit('close')"
        >
          ✕
        </button>

        <!-- Studio Format Picker Tabs (Flex Mode Selector) -->
        <div class="format-switcher-bar">
          <button
            type="button"
            class="format-tab-btn"
            :class="{ 'format-tab-btn--active': activeFormat === 'story' }"
            @click="activeFormat = 'story'"
          >
            <GIcon name="camera" size="xs" />
            <span>Story 9:16</span>
          </button>
          <button
            type="button"
            class="format-tab-btn"
            :class="{ 'format-tab-btn--active': activeFormat === 'post' }"
            @click="activeFormat = 'post'"
          >
            <GIcon name="sparkles" size="xs" />
            <span>Post 1:1</span>
          </button>
          <button
            type="button"
            class="format-tab-btn"
            :class="{ 'format-tab-btn--active': activeFormat === 'sheet' }"
            @click="activeFormat = 'sheet'"
          >
            <GIcon name="passport" size="xs" />
            <span>Lembar Spek</span>
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             MODE 1 & 2: STORY / POST FLEX CARD
             ══════════════════════════════════════════════════════════ -->
        <div
          v-if="activeFormat === 'story' || activeFormat === 'post'"
          class="flex-card-container"
          :class="`flex-card-container--${activeFormat}`"
        >
          <!-- Flex Poster Content -->
          <div class="flex-poster">
            <!-- Poster Header -->
            <div class="flex-poster__header">
              <div class="brand-chip">
                <span class="brand-dot"/>
                <span>GOWESKIT WORKSHOP</span>
              </div>
              <span class="auth-serial">ID: {{ bike.id.slice(0, 8) }}</span>
            </div>

            <!-- Bike Title & Type -->
            <div class="flex-poster__title-block">
              <span class="poster-type-badge">{{ bike.bicycleType.name }}</span>
              <h2 id="passport-title" class="poster-bike-name">{{ bike.nickname }}</h2>
              <p class="poster-model-subtitle">{{ fullBikeTitle }}</p>
            </div>

            <!-- Bike Visual Display (Photo or Custom SVG Vector Artwork) -->
            <div class="flex-poster__artwork-box">
              <img
                v-if="bike.photoUrl"
                :src="bike.photoUrl"
                :alt="bike.nickname"
                class="poster-artwork-img"
              />
              <img
                v-else
                :src="bikeTypeSvg(bike.bicycleType.slug)"
                :alt="bike.bicycleType.name"
                class="poster-artwork-svg"
              />
              <div class="verified-seal-chip">
                <span>✓ {{ knownSpecsCount }}/{{ totalSpecsCount }} STANDAR TERVERIFIKASI</span>
              </div>
            </div>

            <!-- Key Specs Shelf -->
            <div class="flex-poster__specs-shelf">
              <div
                v-for="spec in (bike.specs?.filter((s) => s.knowledge === 'known').slice(0, 4) ?? [])"
                :key="spec.standardCode"
                class="poster-spec-chip"
              >
                <span class="poster-spec-lbl">{{ spec.label }}</span>
                <strong class="poster-spec-val">{{ spec.valueLabel ?? spec.value }}</strong>
              </div>
            </div>

            <!-- Poster Footer with QR code -->
            <div class="flex-poster__footer">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code Garasi" class="poster-qr-code" />
              <div class="poster-footer-text">
                <strong>PINDAI UNTUK ANATOMI LENGKAP</strong>
                <small>Buku Servis &amp; Standar Dimensi Terverifikasi</small>
                <span class="poster-watermark">goweskit.id · Digital Bike Passport</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             MODE 3: TECHNICAL SPEC SHEET (PRINTABLE)
             ══════════════════════════════════════════════════════════ -->
        <div
          v-else
          id="printable-bike-passport"
          class="passport-card-sheet"
        >
          <!-- Sheet Header -->
          <div class="sheet-header">
            <div class="sheet-brand">
              <span class="sheet-logo-box">G</span>
              <div>
                <strong class="sheet-brand-title">GowesKit Workshop</strong>
                <span class="sheet-brand-sub">Lembar Identitas &amp; Spesifikasi Mekanik</span>
              </div>
            </div>
            <span class="sheet-type-pill">{{ bike.bicycleType.name }}</span>
          </div>

          <!-- Hero Identity -->
          <div class="sheet-hero">
            <div class="sheet-hero-text">
              <h2>{{ bike.nickname }}</h2>
              <p>{{ fullBikeTitle }}</p>
              <div class="sheet-pills-row">
                <span class="sheet-stat-pill">✓ {{ knownSpecsCount }}/{{ totalSpecsCount }} Standar Terdata</span>
                <span v-if="bike.modelYear" class="sheet-stat-pill">Tahun {{ bike.modelYear }}</span>
              </div>
            </div>
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="sheet-qr" />
          </div>

          <!-- Full Specs Grid -->
          <div class="sheet-specs-table">
            <div class="specs-table-title">Daftar Standar Dimensi Komponen:</div>
            <div v-if="bike.specs && bike.specs.length > 0" class="specs-dense-grid">
              <div v-for="spec in bike.specs" :key="spec.standardCode" class="dense-cell">
                <span class="dense-cell__lbl">{{ spec.label }}</span>
                <strong class="dense-cell__val">{{ spec.valueLabel ?? spec.value ?? 'Belum terisi' }}</strong>
              </div>
            </div>
            <p v-else class="empty-notice">Belum ada spesifikasi teknis tercatat.</p>
          </div>

          <div class="sheet-footer">
            <small>Diverifikasi dengan engine kompatibilitas deterministik GowesKit · ID: {{ bike.id }}</small>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
             STUDIO ACTION BAR (SHARE & DOWNLOAD)
             ══════════════════════════════════════════════════════════ -->
        <div class="studio-action-bar">
          <button
            type="button"
            class="studio-btn studio-btn--share"
            :disabled="isGeneratingImage"
            @click="shareToMedia"
          >
            <span>📲</span>
            <span>{{ isGeneratingImage ? 'Memproses…' : 'Share ke Medsos' }}</span>
          </button>

          <button
            type="button"
            class="studio-btn studio-btn--download"
            :disabled="isGeneratingImage"
            @click="downloadStoryImage"
          >
            <GIcon name="download" size="xs" />
            <span>Unduh HD (PNG)</span>
          </button>

          <button
            type="button"
            class="studio-btn studio-btn--copy"
            @click="copySpecSummary"
          >
            <GIcon name="share" size="xs" />
            <span>Salin Teks</span>
          </button>

          <button
            v-if="activeFormat === 'sheet'"
            type="button"
            class="studio-btn studio-btn--print"
            @click="handlePrint"
          >
            <GIcon name="passport" size="xs" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.passport-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.passport-modal {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background: #17202A;
  border: 1.5px solid rgba(201, 243, 106, 0.3);
  border-radius: 1.5rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 94vh;
}

.passport-close-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 20;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 100ms ease;
}

.passport-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ══════════════════════════════════════════════════════════
   FORMAT SWITCHER TABS
   ══════════════════════════════════════════════════════════ */
.format-switcher-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.85rem 1rem 0.65rem;
  background: #0F172A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.format-tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.5rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.format-tab-btn--active {
  background: var(--color-chain-lime);
  color: #17202A;
  box-shadow: 0 2px 8px rgba(201, 243, 106, 0.25);
}

/* ══════════════════════════════════════════════════════════
   FLEX POSTER CONTAINER
   ══════════════════════════════════════════════════════════ */
.flex-card-container {
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flex-poster {
  width: 100%;
  background: radial-gradient(circle at top right, #243447 0%, #17202A 100%);
  border: 1.5px solid rgba(201, 243, 106, 0.25);
  border-radius: 1.25rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.flex-poster__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.brand-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
}

.auth-serial {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: #64748B;
}

.flex-poster__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.poster-type-badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: #38BDF8;
  text-transform: uppercase;
}

.poster-bike-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #FFFFFF;
  line-height: 1.15;
}

.poster-model-subtitle {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #94A3B8;
}

/* Artwork Box */
.flex-poster__artwork-box {
  position: relative;
  width: 100%;
  height: 9.5rem;
  background: #0F172A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  overflow: hidden;
}

.poster-artwork-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.65rem;
}

.poster-artwork-svg {
  width: 100%;
  height: 100%;
  max-width: 15rem;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
}

.verified-seal-chip {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  background: rgba(23, 32, 42, 0.9);
  backdrop-filter: blur(6px);
  border: 1px solid var(--color-chain-lime);
  border-radius: 9999px;
  padding: 0.25rem 0.5rem;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}

/* Specs Shelf */
.flex-poster__specs-shelf {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.poster-spec-chip {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.65rem;
  padding: 0.45rem 0.65rem;
  display: flex;
  flex-direction: column;
}

.poster-spec-lbl {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
}

.poster-spec-val {
  font-size: 0.78rem;
  font-weight: 850;
  color: #FFFFFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Poster Footer */
.flex-poster__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.75rem;
}

.poster-qr-code {
  width: 4rem;
  height: 4rem;
  border-radius: 0.45rem;
  background: #FFFFFF;
  padding: 0.2rem;
  flex-shrink: 0;
}

.poster-footer-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.poster-footer-text strong {
  font-size: 0.74rem;
  font-weight: 900;
  color: #FFFFFF;
}

.poster-footer-text small {
  font-size: 0.66rem;
  color: #94A3B8;
}

.poster-watermark {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--color-chain-lime);
  margin-top: 0.15rem;
}

/* ══════════════════════════════════════════════════════════
   MODE 3: SPEC SHEET (WHITE PRINTABLE)
   ══════════════════════════════════════════════════════════ */
.passport-card-sheet {
  padding: 1.25rem;
  background: #FFFFFF;
  color: #17202A;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #17202A;
  padding-bottom: 0.65rem;
}

.sheet-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.sheet-logo-box {
  width: 1.85rem;
  height: 1.85rem;
  background: #17202A;
  color: var(--color-chain-lime);
  font-weight: 900;
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-brand-title {
  display: block;
  font-size: 1rem;
  font-weight: 900;
}

.sheet-brand-sub {
  display: block;
  font-size: 0.65rem;
  color: #64748B;
  text-transform: uppercase;
}

.sheet-type-pill {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  padding: 0.2rem 0.6rem;
  background: #E0F2FE;
  color: #0369A1;
  border-radius: 9999px;
}

.sheet-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.85rem;
  padding: 0.85rem;
}

.sheet-hero-text h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
}

.sheet-hero-text p {
  margin: 0.15rem 0 0.4rem;
  font-size: 0.8rem;
  color: #475569;
}

.sheet-pills-row {
  display: flex;
  gap: 0.35rem;
}

.sheet-stat-pill {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
}

.sheet-qr {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.45rem;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  padding: 0.15rem;
}

.specs-table-title {
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  margin-bottom: 0.45rem;
}

.specs-dense-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
}

.dense-cell {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.45rem;
  padding: 0.35rem 0.5rem;
  display: flex;
  flex-direction: column;
}

.dense-cell__lbl {
  font-size: 0.62rem;
  color: #64748B;
}

.dense-cell__val {
  font-size: 0.78rem;
  color: #17202A;
}

.sheet-footer {
  text-align: center;
  border-top: 1px solid #E2E8F0;
  padding-top: 0.65rem;
  font-size: 0.65rem;
  color: #64748B;
}

/* ══════════════════════════════════════════════════════════
   STUDIO ACTION BAR
   ══════════════════════════════════════════════════════════ */
.studio-action-bar {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  background: #0F172A;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.studio-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.6rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 100ms ease;
  white-space: nowrap;
  border: none;
}

.studio-btn:active {
  transform: scale(0.96);
}

.studio-btn--share {
  background: var(--color-chain-lime);
  color: #17202A;
  box-shadow: 0 2px 8px rgba(201, 243, 106, 0.25);
}

.studio-btn--download {
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.studio-btn--copy {
  background: rgba(255, 255, 255, 0.08);
  color: #CBD5E1;
}

.studio-btn--print {
  grid-column: span 3;
  background: #334155;
  color: #FFFFFF;
}

@media print {
  .passport-backdrop {
    position: static;
    background: none;
    padding: 0;
  }
  .passport-modal {
    max-width: 100%;
    box-shadow: none;
    border: none;
  }
  .format-switcher-bar,
  .studio-action-bar,
  .passport-close-btn {
    display: none !important;
  }
}
</style>
