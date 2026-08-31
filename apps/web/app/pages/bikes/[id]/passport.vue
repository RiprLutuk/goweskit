<script setup lang="ts">
import type { PublicBikePassportResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { toast } = useNotify();

const bikeId = String(route.params.id || '');
const loading = ref(true);
const error = ref<string | null>(null);
const passportData = ref<PublicBikePassportResponse['bike'] | null>(null);

onMounted(async () => {
  try {
    const res = await api<PublicBikePassportResponse>(
      `/bikes/${bikeId}/public-passport`,
    );
    passportData.value = res.bike;
  } catch {
    error.value = 'Paspor digital sepeda tidak ditemukan atau ID tidak valid.';
  } finally {
    loading.value = false;
  }
});

function copyPageLink() {
  if (typeof window !== 'undefined') {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan Paspor Disalin!', 'Siap dibagikan.');
  }
}
</script>

<template>
  <div class="passport-page-container">
    <div v-if="loading" class="passport-card loading-state">
      <div class="spinner" />
      <p>Memverifikasi Paspor Digital Sepeda...</p>
    </div>

    <div v-else-if="error || !passportData" class="passport-card error-state">
      <GIcon name="alert-circle" size="lg" color="#EF4444" />
      <h2>Paspor Tidak Ditemukan</h2>
      <p>
        {{
          error || 'ID Sepeda tidak terdaftar dalam basis data resmi GowesKit.'
        }}
      </p>
      <NuxtLink to="/" class="btn-home">Kembali ke Beranda</NuxtLink>
    </div>

    <div v-else class="passport-card">
      <!-- Certificate Header Banner -->
      <div class="passport-header">
        <div class="shield-badge">
          <GIcon name="shield-check" size="md" color="#22C55E" />
        </div>
        <div class="header-text">
          <span class="cert-label">SERTIFIKAT KEPEMILIKAN DIGITAL</span>
          <h1 class="bike-title">{{ passportData.nickname }}</h1>
          <span class="bike-subtitle"
            >{{ passportData.brand || 'Bicycle' }}
            {{ passportData.model || '' }} ({{
              passportData.modelYear || 'Modern'
            }}) · {{ passportData.bicycleType }}</span
          >
        </div>
      </div>

      <!-- Verification Seal Box -->
      <div class="seal-box">
        <div class="seal-item">
          <span class="seal-lbl">STATUS KEPEMILIKAN</span>
          <strong class="seal-val text-verified">✓ TERVERIFIKASI SAH</strong>
        </div>
        <div class="seal-divider" />
        <div class="seal-item">
          <span class="seal-lbl">PASSPORT UID</span>
          <strong class="seal-val font-mono">{{
            passportData.passportUid
          }}</strong>
        </div>
        <div class="seal-divider" />
        <div class="seal-item">
          <span class="seal-lbl">TANGGAL REGISTRASI</span>
          <strong class="seal-val">{{
            new Date(passportData.registeredAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          }}</strong>
        </div>
      </div>

      <!-- Specs & Component Passport Section -->
      <div class="specs-section">
        <h2 class="section-title">
          <GIcon name="wrench" size="xs" color="var(--color-chain-lime)" />
          <span>Spesifikasi Standar Komponen Terdaftar</span>
        </h2>

        <div v-if="passportData.specs.length === 0" class="empty-specs">
          <p>
            Belum ada spesifikasi standar khusus yang dicatat untuk sepeda ini.
          </p>
        </div>

        <div v-else class="specs-grid">
          <div
            v-for="spec in passportData.specs"
            :key="spec.standardCode"
            class="spec-card"
          >
            <span class="spec-name">{{ spec.label }}</span>
            <strong class="spec-value">{{
              spec.valueLabel || spec.value || 'Standar Pabrik'
            }}</strong>
            <small class="spec-code">{{ spec.standardCode }}</small>
          </div>
        </div>
      </div>

      <!-- Anti-Theft Protection Notice -->
      <div class="anti-theft-notice">
        <GIcon name="shield" size="sm" color="#38BDF8" />
        <div class="notice-text">
          <strong>Proteksi Komunitas Anti-Curanmor</strong>
          <p>
            Sepeda ini dilindungi oleh sertifikat paspor digital GowesKit. Jika
            sepeda ini ditemukan dalam transaksi jual-beli tanpa konfirmasi
            pemilik asli, laporkan melalui platform GowesKit.
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="passport-actions">
        <button type="button" class="btn-action-primary" @click="copyPageLink">
          <GIcon name="share" size="xs" />
          <span>Bagikan Paspor Digital</span>
        </button>
        <NuxtLink to="/" class="btn-action-secondary">
          <GIcon name="bicycle" size="xs" />
          <span>Buka GowesKit App</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.passport-page-container {
  min-height: 100vh;
  background: radial-gradient(circle at top, #0f172a 0%, #030712 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
}

.passport-card {
  background: #090e1a;
  border: 1.5px solid rgba(201, 243, 106, 0.3);
  border-radius: 1.5rem;
  width: 100%;
  max-width: 40rem;
  padding: 1.75rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-state,
.error-state {
  align-items: center;
  text-align: center;
  padding: 3rem 1.5rem;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-chain-lime);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.passport-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.shield-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 2px solid rgba(34, 197, 94, 0.4);
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cert-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: var(--color-chain-lime);
  letter-spacing: 0.05em;
}

.bike-title {
  margin: 0.2rem 0 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #f8fafc;
}

.bike-subtitle {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 600;
}

.seal-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1rem;
  gap: 0.5rem;
}

.seal-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.2rem;
}

.seal-lbl {
  font-size: 0.6rem;
  font-weight: 750;
  color: #64748b;
}

.seal-val {
  font-size: 0.85rem;
  font-weight: 850;
  color: #f8fafc;
}

.seal-divider {
  width: 1px;
  height: 2rem;
  background: rgba(255, 255, 255, 0.1);
}

.text-verified {
  color: #22c55e;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.92rem;
  font-weight: 850;
  color: #f8fafc;
  margin-bottom: 0.85rem;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: 0.75rem;
}

.spec-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.spec-name {
  font-size: 0.7rem;
  color: #94a3b8;
}

.spec-value {
  font-size: 0.85rem;
  font-weight: 800;
  color: #f8fafc;
}

.spec-code {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: #475569;
}

.anti-theft-notice {
  display: flex;
  gap: 0.75rem;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 1rem;
  padding: 0.9rem 1.1rem;
  align-items: flex-start;
}

.notice-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.notice-text strong {
  font-size: 0.82rem;
  color: #38bdf8;
}

.notice-text p {
  margin: 0;
  font-size: 0.76rem;
  color: #bae6fd;
  line-height: 1.4;
}

.passport-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-action-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 850;
  cursor: pointer;
}

.btn-action-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
}
</style>
