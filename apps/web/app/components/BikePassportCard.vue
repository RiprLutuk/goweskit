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

async function generateQrCode() {
  if (typeof window === 'undefined') return;
  try {
    const currentUrl = window.location.href;
    qrDataUrl.value = await QRCode.toDataURL(currentUrl, {
      margin: 1,
      width: 200,
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

  const summary = `🚲 ${props.bike.nickname} (${fullBikeTitle.value})
Tipe: ${props.bike.bicycleType.name}
Spek Terdata: ${String(knownSpecsCount.value)}/${String(totalSpecsCount.value)}

Daftar Komponen & Standar:
${specsText}

Diverifikasi via GowesKit: ${window.location.href}`;

  try {
    await navigator.clipboard.writeText(summary);
    toast.success(
      'Disalin ke Clipboard',
      'Ringkasan spesifikasi siap dikirim ke mekanik.',
    );
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
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

        <!-- Printable Card Container -->
        <div id="printable-bike-passport" class="passport-card">
          <!-- Card Header / Brand -->
          <div class="passport-header">
            <div class="passport-header__brand">
              <span class="passport-logo-icon">G</span>
              <div>
                <span class="passport-logo-text">Gowes<strong>Kit</strong></span>
                <span class="passport-sub">Bicycle Identity &amp; Spec Card</span>
              </div>
            </div>
            <div class="passport-badge">
              {{ bike.bicycleType.name }}
            </div>
          </div>

          <!-- Hero Identity Info -->
          <div class="passport-hero">
            <div v-if="bike.photoUrl" class="passport-photo-box">
              <img :src="bike.photoUrl" :alt="bike.nickname" class="passport-photo" />
            </div>
            <div v-else class="passport-photo-box passport-photo-box--empty">
              <span>🚲</span>
            </div>

            <div class="passport-title-group">
              <span class="passport-label">Identitas Sepeda</span>
              <h2 id="passport-title" class="passport-nickname">{{ bike.nickname }}</h2>
              <p class="passport-model">{{ fullBikeTitle }}</p>
              <div class="passport-meta-pills">
                <span class="meta-pill">
                  ✓ {{ knownSpecsCount }}/{{ totalSpecsCount }} Terdata
                </span>
                <span v-if="bike.modelYear" class="meta-pill">Tahun {{ bike.modelYear }}</span>
              </div>
            </div>
          </div>

          <!-- QR Code & Mechanical Quick Reference -->
          <div class="passport-specs-section">
            <div class="passport-qr-col">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code Garasi" class="passport-qr-img" />
              <span class="passport-qr-caption">Pindai untuk akses live spec &amp; riwayat servis</span>
            </div>

            <div class="passport-specs-list">
              <div class="specs-grid-title">Standar Komponen Utama:</div>
              <div v-if="bike.specs && bike.specs.length > 0" class="specs-grid">
                <div v-for="spec in bike.specs" :key="spec.standardCode" class="spec-cell">
                  <span class="spec-cell__cat">{{ spec.label }}</span>
                  <span class="spec-cell__val">{{ spec.valueLabel ?? spec.value ?? 'Belum terisi' }}</span>
                </div>
              </div>
              <div v-else class="specs-empty">
                Belum ada spesifikasi teknis yang tercatat di garasi.
              </div>
            </div>
          </div>

          <!-- Footer Watermark -->
          <div class="passport-footer">
            <span>Standar diverifikasi dengan aturan kompatibilitas deterministik GowesKit.</span>
            <span>ID: {{ bike.id.slice(0, 8) }}</span>
          </div>
        </div>

        <!-- Action Bar (Not printed) -->
        <div class="passport-actions">
          <button type="button" class="action-btn action-btn--secondary" @click="copySpecSummary">
            📋 Salin Spek
          </button>
          <button type="button" class="action-btn action-btn--primary" @click="handlePrint">
            🖨️ Cetak / Simpan PDF
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
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.passport-modal {
  position: relative;
  width: 100%;
  max-width: 32rem;
  background: #FFFFFF;
  border-radius: 1.25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 90vh;
}

.passport-close-btn {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 10;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(23, 32, 42, 0.1);
  color: #17202A;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.passport-card {
  padding: 1.5rem;
  background: #FFFFFF;
  color: #17202A;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
}

.passport-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #17202A;
  padding-bottom: 0.85rem;
}

.passport-header__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.passport-logo-icon {
  width: 1.85rem;
  height: 1.85rem;
  background: #17202A;
  color: #C9F36A;
  font-weight: 900;
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.passport-logo-text {
  display: block;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.1;
  color: #17202A;
}

.passport-logo-text strong {
  color: #0F766E;
}

.passport-sub {
  display: block;
  font-size: 0.62rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.passport-badge {
  background: #C9F36A;
  color: #17202A;
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1.5px solid #17202A;
}

.passport-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 1rem;
  padding: 0.85rem;
}

.passport-photo-box {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.75rem;
  overflow: hidden;
  flex-shrink: 0;
  border: 1.5px solid #17202A;
  background: #FFFFFF;
}

.passport-photo-box--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: #F1F5F9;
}

.passport-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.passport-title-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.passport-label {
  font-size: 0.62rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
}

.passport-nickname {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #17202A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.passport-model {
  margin: 0 0 0.4rem 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.passport-meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta-pill {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #334155;
}

.passport-specs-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.passport-qr-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 6.5rem;
  flex-shrink: 0;
  text-align: center;
}

.passport-qr-img {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 0.5rem;
  border: 1px solid #E2E8F0;
  padding: 0.2rem;
  background: #FFFFFF;
}

.passport-qr-caption {
  font-size: 0.55rem;
  font-weight: 700;
  color: #64748B;
  margin-top: 0.35rem;
  line-height: 1.25;
}

.passport-specs-list {
  flex: 1;
  min-width: 0;
}

.specs-grid-title {
  font-size: 0.68rem;
  font-weight: 850;
  color: #17202A;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  letter-spacing: 0.04em;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;
}

.spec-cell {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  padding: 0.35rem 0.5rem;
  display: flex;
  flex-direction: column;
}

.spec-cell__cat {
  font-size: 0.55rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
}

.spec-cell__val {
  font-size: 0.72rem;
  font-weight: 800;
  color: #17202A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.specs-empty {
  font-size: 0.75rem;
  color: #94A3B8;
  font-style: italic;
}

.passport-footer {
  border-top: 1px dashed #CBD5E1;
  padding-top: 0.65rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.58rem;
  font-weight: 700;
  color: #94A3B8;
}

.passport-actions {
  display: flex;
  gap: 0.65rem;
  padding: 1rem 1.5rem;
  background: #F8FAFC;
  border-top: 1px solid #E2E8F0;
}

.action-btn {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: transform 120ms ease;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn--secondary {
  background: #FFFFFF;
  border: 1.5px solid #CBD5E1;
  color: #17202A;
}

.action-btn--primary {
  background: #17202A;
  border: 1.5px solid #17202A;
  color: #FFFFFF;
}

@media print {
  body * {
    visibility: hidden;
  }
  #printable-bike-passport,
  #printable-bike-passport * {
    visibility: visible;
  }
  #printable-bike-passport {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: 2px solid #17202A !important;
  }
  .passport-actions,
  .passport-close-btn {
    display: none !important;
  }
}
</style>
