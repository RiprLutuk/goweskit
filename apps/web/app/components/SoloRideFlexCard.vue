<script setup lang="ts">
import type { SafetySession } from '@goweskit/contracts';

const props = defineProps<{
  session: SafetySession | null;
  isOpen: boolean;
  riderName?: string;
  shareUrl?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { toast } = useNotify();
const isGenerating = ref(false);

const activeShareUrl = computed(() => {
  if (props.shareUrl) return props.shareUrl;
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/safety`;
});

const durationMinutes = computed(() => {
  if (!props.session?.expectedEndAt || !props.session?.startedAt) return 60;
  const diff = Math.round(
    (new Date(props.session.expectedEndAt).getTime() -
      new Date(props.session.startedAt).getTime()) /
      60000,
  );
  return diff > 0 ? diff : 60;
});

async function copyShareText() {
  const note = props.session?.note
    ? `\n📍 Rute/Rencana: ${props.session.note}`
    : '';
  const text = `🚴 GOWESKIT SAFE RIDER PASS
━━━━━━━━━━━━━━━━━━━━
🛡️ Sesi Solo Ride Aktif & Terpantau
⏱️ Durasi Rencana: ${durationMinutes.value} Menit${note}
👥 Kontak Terpercaya Terhubung

🔗 Pantau posisi & status live aman saya di:
${activeShareUrl.value}

#GowesKit #SoloRide #GowesAman #LiveSafety`;

  try {
    await navigator.clipboard.writeText(text);
    toast.success(
      'Pesan Status Disalin!',
      'Siap dibagikan ke WhatsApp Status atau Grup Komunitas.',
    );
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

async function renderCanvas(): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  canvas.width = 1080;
  canvas.height = 1920;

  // 1. Dark asphalt gradient
  ctx.fillStyle = '#17202A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Blueprint radar rings
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.08)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(540, 750, 420, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(540, 750, 260, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Header
  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('GOWESKIT · SOLO RIDE SAFE PASS', 80, 140);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 68px sans-serif';
  ctx.fillText('SOLO RIDER', 80, 260);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('🛡️ LIVE SAFETY SESSION ACTIVE', 80, 320);

  // 4. Center Badge Box
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(80, 420, 920, 680, 32);
  ctx.fill();
  ctx.stroke();

  // Pulse Icon
  ctx.fillStyle = '#C9F36A';
  ctx.font = '140px sans-serif';
  ctx.fillText('🚴‍♂️', 470, 620);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    props.riderName
      ? `Gowes ${props.riderName}`
      : 'Gowes Solo Nyaman & Terpantau',
    540,
    740,
  );

  ctx.fillStyle = '#94A3B8';
  ctx.font = '32px sans-serif';
  const ruteText = props.session?.note || 'Eksplorasi Rute Gowes Mandiri';
  ctx.fillText(
    ruteText.length > 36 ? ruteText.slice(0, 36) + '…' : ruteText,
    540,
    800,
  );

  // Metrics Bar
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(140, 870, 800, 160, 20);
  ctx.fill();

  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 38px monospace';
  ctx.fillText(`${durationMinutes.value} MIN`, 320, 950);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '22px sans-serif';
  ctx.fillText('DURASI RENCANA', 320, 990);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 38px monospace';
  ctx.fillText('TERHUBUNG', 740, 950);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '22px sans-serif';
  ctx.fillText('KONTAK AMAN', 740, 990);

  ctx.textAlign = 'left';

  // 5. Feature Highlights
  const highlights = [
    '✓ Enkripsi Token Live Berdurasi Terbatas',
    '✓ Pantauan Posisi Real-Time untuk Kontak Darurat',
    '✓ Tombol Darurat SOS & Tombol Bantuan Bengkel',
    '✓ Zero Tracking di Luar Sesi Gowes',
  ];

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '30px sans-serif';
  highlights.forEach((h, idx) => {
    ctx.fillText(h, 100, 1220 + idx * 70);
  });

  // 6. Footer Stamp
  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('⚡ POWERED BY GOWESKIT SAFETY ENGINE · GOWESKIT.ID', 80, 1820);

  return canvas;
}

async function downloadStoryImage() {
  isGenerating.value = true;
  try {
    const canvas = await renderCanvas();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Blob creation failed');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GowesKit_Safe_Rider_Pass.png';
    link.click();
    URL.revokeObjectURL(url);

    toast.success(
      'Poster Story Terunduh!',
      'Format pas untuk WhatsApp Status atau Instagram Story.',
    );
  } catch (err) {
    console.error('Download error:', err);
    toast.error('Gagal mengunduh', 'Silakan gunakan tombol salin teks.');
  } finally {
    isGenerating.value = false;
  }
}

async function shareToMedia() {
  isGenerating.value = true;
  try {
    const canvas = await renderCanvas();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Blob creation failed');

    const file = new File([blob], 'GowesKit_Safe_Rider_Pass.png', {
      type: 'image/png',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'GowesKit Safe Rider Pass',
        text: `Sesi solo ride saya aktif dan terpantau di GowesKit: ${activeShareUrl.value}`,
      });
      toast.success('Berhasil Dibagikan!', 'Safe Rider Pass siap diposting.');
    } else if (navigator.share) {
      await navigator.share({
        title: 'GowesKit Safe Rider Pass',
        text: `Sesi solo ride saya aktif dan terpantau di GowesKit: ${activeShareUrl.value}`,
        url: activeShareUrl.value,
      });
      toast.success('Tautan Dibagikan!', 'Tautan live tracking dibuka.');
    } else {
      await copyShareText();
    }
  } catch (err: unknown) {
    if ((err as Error)?.name !== 'AbortError') {
      await copyShareText();
    }
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="flex-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flex-modal-title"
      @click.self="emit('close')"
    >
      <div class="flex-modal-card">
        <button
          type="button"
          class="flex-close-btn"
          aria-label="Tutup"
          @click="emit('close')"
        >
          ✕
        </button>

        <!-- Preview Poster -->
        <div class="pass-preview">
          <div class="pass-header">
            <div class="pass-badge">
              <span class="pass-dot" />
              <span>GOWESKIT SAFE RIDER</span>
            </div>
            <span class="pass-chip">LIVE SESSION</span>
          </div>

          <div class="pass-hero-center">
            <span class="pass-icon">🚴‍♂️</span>
            <h2 id="flex-modal-title" class="pass-title">
              {{ riderName ? `Gowes ${riderName}` : 'Solo Rider Terlindungi' }}
            </h2>
            <p class="pass-sub">
              {{
                session?.note ||
                'Sesi gowes solo dengan proteksi live tracking dan kontak darurat aktif.'
              }}
            </p>
          </div>

          <div class="pass-stats-grid">
            <div class="pass-stat-card">
              <span class="stat-lbl">Durasi Rencana</span>
              <strong class="stat-val">{{ durationMinutes }} Min</strong>
            </div>
            <div class="pass-stat-card">
              <span class="stat-lbl">Kontak Aman</span>
              <strong class="stat-val">Terhubung</strong>
            </div>
          </div>

          <div class="pass-features-list">
            <div class="feature-line">✓ Enkripsi Token Live Tracking</div>
            <div class="feature-line">✓ Notifikasi Darurat Otomatis</div>
          </div>
        </div>

        <!-- Action Bar -->
        <div class="pass-action-bar">
          <button
            type="button"
            class="action-btn action-btn--primary"
            :disabled="isGenerating"
            @click="shareToMedia"
          >
            <span>📲</span>
            <span>{{ isGenerating ? 'Memproses…' : 'Share ke Medsos' }}</span>
          </button>
          <button
            type="button"
            class="action-btn action-btn--secondary"
            :disabled="isGenerating"
            @click="downloadStoryImage"
          >
            <span>🖼️</span>
            <span>Unduh Story PNG</span>
          </button>
          <button
            type="button"
            class="action-btn action-btn--ghost"
            @click="copyShareText"
          >
            <span>📋</span>
            <span>Salin Pesan</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.flex-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.flex-modal-card {
  position: relative;
  width: 100%;
  max-width: 28rem;
  background: #17202a;
  border: 1.5px solid rgba(201, 243, 106, 0.3);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.flex-close-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 20;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pass-preview {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: radial-gradient(circle at top right, #243447 0%, #17202a 100%);
}

.pass-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pass-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.pass-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
}

.pass-chip {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #38bdf8;
}

.pass-hero-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
}

.pass-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 12px rgba(201, 243, 106, 0.3));
}

.pass-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: #ffffff;
}

.pass-sub {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
  max-width: 22rem;
}

.pass-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.pass-stat-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.65rem 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-lbl {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.stat-val {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.pass-features-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.75rem;
}

.feature-line {
  font-size: 0.75rem;
  color: #cbd5e1;
  font-weight: 700;
}

/* Action Bar */
.pass-action-bar {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  background: #0f172a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.6rem 0.45rem;
  border-radius: 0.75rem;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
  border: none;
  transition: all 100ms ease;
  white-space: nowrap;
}

.action-btn:active {
  transform: scale(0.96);
}

.action-btn--primary {
  background: var(--color-chain-lime);
  color: #17202a;
}

.action-btn--secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn--ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}
</style>
