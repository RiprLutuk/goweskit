<script setup lang="ts">
import type { Bike } from '@goweskit/contracts';
import { generateQrMatrix, generateQrSvg, drawQrToCanvas } from '../qr-code';

const props = defineProps<{
  isOpen: boolean;
  bike: Bike;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { toast } = useNotify();

const colorTheme = ref<'stealth' | 'cyber' | 'aero' | 'orange'>('cyber');

const passportUid = computed(() => {
  return `GWK-${props.bike.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
});

const passportPublicUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/bikes/${props.bike.id}/passport`;
  }
  return `https://goweskit.id/bikes/${props.bike.id}/passport`;
});

const qrMatrix = computed(() => {
  return generateQrMatrix(passportPublicUrl.value);
});

const qrColors = computed(() => {
  const fg =
    colorTheme.value === 'aero'
      ? '#0f172a'
      : colorTheme.value === 'cyber'
        ? '#C9F36A'
        : colorTheme.value === 'orange'
          ? '#FB923C'
          : '#F8FAFC';
  const bg = colorTheme.value === 'aero' ? '#ffffff' : '#0B1120';
  return { fg, bg };
});

async function copyPassportLink() {
  try {
    await navigator.clipboard.writeText(passportPublicUrl.value);
    toast.success(
      'Tautan Paspor Disalin!',
      'Siap dibagikan atau dipasang di media sosial.',
    );
  } catch {
    toast.error('Gagal Menyalin', 'Salin secara manual.');
  }
}

function downloadStickerSvg() {
  const qrSvgMarkup = generateQrSvg(passportPublicUrl.value, {
    size: 152,
    foreground: qrColors.value.fg,
    background: qrColors.value.bg,
    margin: 1,
  });
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200" width="600" height="200">
  <rect width="100%" height="100%" rx="16" fill="${colorTheme.value === 'aero' ? '#ffffff' : '#080D19'}" stroke="${colorTheme.value === 'cyber' ? '#C9F36A' : '#38BDF8'}" stroke-width="4" />
  <g transform="translate(24, 24)">
    ${qrSvgMarkup}
  </g>
  <text x="190" y="60" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="${colorTheme.value === 'aero' ? '#0f172a' : '#ffffff'}">${props.bike.nickname}</text>
  <text x="190" y="92" font-family="system-ui, sans-serif" font-weight="700" font-size="18" fill="${colorTheme.value === 'cyber' ? '#C9F36A' : '#38BDF8'}">${props.bike.brand || 'Custom'} ${props.bike.model || ''} · ${passportUid.value}</text>
  <text x="190" y="130" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">🔒 PASPOR DIGITAL &amp; VERIFIKASI RESMI KEPEMILIKAN</text>
  <text x="190" y="155" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#22C55E">✓ TERVERIFIKASI GOWESKIT</text>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GowesKit_Sticker_${passportUid.value}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(
    'File Vektor SVG Terunduh!',
    'Format tajam siap dibawa ke percetakan stiker.',
  );
}

async function downloadStickerPng() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isLight = colorTheme.value === 'aero';
  ctx.fillStyle = isLight ? '#ffffff' : '#080d19';
  ctx.beginPath();
  ctx.roundRect(0, 0, 1200, 400, 32);
  ctx.fill();

  ctx.strokeStyle =
    colorTheme.value === 'cyber'
      ? '#C9F36A'
      : colorTheme.value === 'orange'
        ? '#FB923C'
        : '#38BDF8';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Draw QR code onto canvas
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = 300;
  qrCanvas.height = 300;
  drawQrToCanvas(qrCanvas, passportPublicUrl.value, {
    foreground: isLight
      ? '#0f172a'
      : colorTheme.value === 'cyber'
        ? '#C9F36A'
        : colorTheme.value === 'orange'
          ? '#FB923C'
          : '#F8FAFC',
    background: isLight ? '#ffffff' : '#0b1120',
    margin: 1,
  });
  ctx.drawImage(qrCanvas, 50, 50, 300, 300);

  // Draw typography
  ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
  ctx.font = '900 52px system-ui, sans-serif';
  ctx.fillText(props.bike.nickname, 390, 120);

  ctx.fillStyle = colorTheme.value === 'cyber' ? '#C9F36A' : '#38BDF8';
  ctx.font = '800 36px monospace';
  ctx.fillText(
    `${props.bike.brand || 'Custom'} ${props.bike.model || ''} · ${passportUid.value}`,
    390,
    180,
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('🔒 PASPOR DIGITAL & VERIFIKASI RESMI KEPEMILIKAN', 390, 250);

  ctx.fillStyle = '#22c55e';
  ctx.font = '800 28px system-ui, sans-serif';
  ctx.fillText('✓ TERVERIFIKASI ANTI-CURANMOR DI GOWESKIT.ID', 390, 310);

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, 'image/png'),
  );
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GowesKit_Frame_Sticker_${passportUid.value}.png`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(
    'Stiker PNG High-Res 300 DPI Terunduh!',
    'Ukuran proporsional siap dipotong dan ditempel di frame.',
  );
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="sticker-modal-card">
      <header class="modal-head">
        <div class="head-title">
          <GIcon name="qr-code" size="sm" color="var(--color-chain-lime)" />
          <strong>Cetak Stiker QR Frame Passport</strong>
        </div>
        <button type="button" class="btn-close" @click="emit('close')">
          <GIcon name="close" size="xs" />
        </button>
      </header>

      <div class="modal-body">
        <p class="modal-desc">
          Tempelkan stiker QR code ini di <em>top tube</em> atau
          <em>down tube</em> sepeda Anda. Siapa pun yang memindai dapat
          memverifikasi bahwa sepeda ini milik Anda secara sah dan mengecek
          spesifikasi komponen.
        </p>

        <!-- Sticker Live Preview Box -->
        <div class="sticker-preview-canvas" :class="`theme--${colorTheme}`">
          <div class="sticker-qr-box">
            <svg
              :viewBox="`0 0 ${qrMatrix.length + 2} ${qrMatrix.length + 2}`"
              width="140"
              height="140"
              shape-rendering="crispEdges"
              class="sticker-qr-svg"
            >
              <rect width="100%" height="100%" :fill="qrColors.bg" rx="6" />
              <g :fill="qrColors.fg">
                <template v-for="(row, r) in qrMatrix" :key="r">
                  <template v-for="(cell, c) in row" :key="c">
                    <rect
                      v-if="cell"
                      :x="c + 1"
                      :y="r + 1"
                      width="1"
                      height="1"
                    />
                  </template>
                </template>
              </g>
            </svg>
          </div>
          <div class="sticker-meta-box">
            <span class="sticker-brand-pill">
              <GIcon name="shield-check" size="xs" color="#22C55E" />
              <span>VERIFIED BIKE PASSPORT</span>
            </span>
            <strong class="sticker-bike-name">{{ bike.nickname }}</strong>
            <span class="sticker-bike-model"
              >{{ bike.brand || 'Bicycle' }} {{ bike.model || '' }}</span
            >
            <span class="sticker-uid-tag">{{ passportUid }}</span>
          </div>
        </div>

        <!-- Theme Selector -->
        <div class="custom-row">
          <label class="custom-label">Nuansa Warna Stiker:</label>
          <div class="theme-pills">
            <button
              type="button"
              class="t-pill"
              :class="{ active: colorTheme === 'cyber' }"
              @click="colorTheme = 'cyber'"
            >
              <span class="dot dot-cyber" /> Cyber Lime
            </button>
            <button
              type="button"
              class="t-pill"
              :class="{ active: colorTheme === 'stealth' }"
              @click="colorTheme = 'stealth'"
            >
              <span class="dot dot-stealth" /> Stealth Dark
            </button>
            <button
              type="button"
              class="t-pill"
              :class="{ active: colorTheme === 'aero' }"
              @click="colorTheme = 'aero'"
            >
              <span class="dot dot-aero" /> Aero White
            </button>
            <button
              type="button"
              class="t-pill"
              :class="{ active: colorTheme === 'orange' }"
              @click="colorTheme = 'orange'"
            >
              <span class="dot dot-orange" /> Sunset Flare
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-grid">
          <button
            type="button"
            class="btn-download-primary"
            @click="downloadStickerPng"
          >
            <GIcon name="download" size="xs" />
            <span>Unduh Stiker PNG (Siap Cetak)</span>
          </button>
          <button
            type="button"
            class="btn-download-secondary"
            @click="downloadStickerSvg"
          >
            <GIcon name="file-code" size="xs" />
            <span>Unduh Vektor SVG</span>
          </button>
          <button type="button" class="btn-copy-link" @click="copyPassportLink">
            <GIcon name="link" size="xs" />
            <span>Salin Tautan Paspor</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 16, 0.85);
  backdrop-filter: blur(8px);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.sticker-modal-card {
  background: #0d1527;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 32rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.head-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #f8fafc;
}

.btn-close {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #94a3b8;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-desc {
  margin: 0;
  font-size: 0.82rem;
  color: #94a3b8;
  line-height: 1.45;
}

.sticker-preview-canvas {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 2px solid rgba(201, 243, 106, 0.4);
  background: #080d19;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.theme--aero {
  background: #ffffff;
  border-color: #0f172a;
}
.theme--aero .sticker-bike-name {
  color: #0f172a;
}
.theme--aero .sticker-bike-model {
  color: #475569;
}
.theme--aero .sticker-uid-tag {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.theme--stealth {
  border-color: rgba(255, 255, 255, 0.2);
}

.theme--orange {
  border-color: rgba(251, 146, 60, 0.5);
}

.sticker-qr-box {
  flex-shrink: 0;
  width: 5.5rem;
  height: 5.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  overflow: hidden;
}

.sticker-meta-box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sticker-brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.58rem;
  font-weight: 850;
  color: #22c55e;
  letter-spacing: 0.04em;
}

.sticker-bike-name {
  font-size: 1.1rem;
  font-weight: 900;
  color: #f8fafc;
}

.sticker-bike-model {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 600;
}

.sticker-uid-tag {
  display: inline-block;
  align-self: flex-start;
  margin-top: 0.2rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
  background: rgba(201, 243, 106, 0.12);
  color: var(--color-chain-lime);
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.custom-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.custom-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #94a3b8;
}

.theme-pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.t-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 0.35rem 0.65rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.t-pill.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}
.dot-cyber {
  background: #c9f36a;
}
.dot-stealth {
  background: #64748b;
}
.dot-aero {
  background: #f8fafc;
}
.dot-orange {
  background: #fb923c;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.btn-download-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 900;
  cursor: pointer;
}

.btn-download-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1.5px solid rgba(56, 189, 248, 0.3);
  padding: 0.65rem;
  border-radius: 0.75rem;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-copy-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.6rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 750;
  cursor: pointer;
}
</style>
