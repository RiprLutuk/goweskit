<script setup lang="ts">
import type { SafetyShareResponse } from '@goweskit/contracts/safety';

import { formatAccuracy, readSafetyShareToken } from '../../safety';

const api = useApi();
const share = ref<SafetyShareResponse | null>(null);
const loading = ref(true);
const errorMessage = ref('');

onMounted(resolveShare);

async function resolveShare(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  share.value = null;
  const token = readSafetyShareToken(window.location.hash);
  if (token === null) {
    errorMessage.value =
      'Tautan pemantauan privat ini tidak valid, tidak lengkap, atau sudah tidak tersedia.';
    loading.value = false;
    return;
  }

  try {
    share.value = await api<SafetyShareResponse>('/safety/share', {
      method: 'POST',
      body: { token },
    });
  } catch {
    errorMessage.value =
      'Tautan pemantauan privat ini tidak valid, telah kedaluwarsa, dicabut oleh rider, atau sedang tidak dapat diakses.';
  } finally {
    loading.value = false;
  }
}

function formatDate(value: string | null): string {
  if (value === null) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

function statusLabel(status: SafetyShareResponse['status']): string {
  switch (status) {
    case 'active':
      return 'Sedang Berlangsung';
    case 'sos':
      return 'Darurat (SOS)';
    case 'ended':
      return 'Selesai';
    case 'revoked':
      return 'Akses Dicabut';
    case 'expired':
      return 'Kedaluwarsa';
  }
}
</script>

<template>
  <div class="page-stack share-page">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">
        <GIcon name="shield" size="xs" color="#0284C7" filled />
        <span>Pemantauan Gowes Solo Privat</span>
      </span>
      <h1>Status Pembaruan Ride Safety</h1>
      <p>
        Halaman ini hanya dapat diakses oleh pemegang tautan privat resmi. Tidak
        melacak posisi secara live tanpa izin.
      </p>
    </header>

    <aside class="public-warning" aria-label="Batasan penting keselamatan">
      <div class="warning-icon-circle">
        <GIcon name="shield" size="xs" color="#B91C1C" filled />
      </div>
      <p>
        <strong>Bukan layanan tanggap darurat kepolisian.</strong> GowesKit
        tidak melakukan panggilan atau pengiriman ambulans/polisi otomatis. Jika
        rekan Anda dalam bahaya, segera hubungi nomor darurat 112 atau fasilitas
        medis setempat.
      </p>
    </aside>

    <!-- Skeleton Share Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem">
      <div
        style="
          padding: 1.5rem;
          display: grid;
          gap: 0.85rem;
          border-radius: 1.25rem;
          background: var(--color-white);
          border: 1px solid rgb(23 32 42 / 8%);
        "
      >
        <div
          class="skeleton-shimmer"
          style="width: 30%; height: 1.1rem; border-radius: 0.35rem"
        />
        <div
          class="skeleton-shimmer"
          style="width: 60%; height: 2rem; border-radius: 0.5rem"
        />
        <div
          class="skeleton-shimmer"
          style="width: 85%; height: 1rem; border-radius: 0.35rem"
        />
      </div>
    </div>
    <section
      v-else-if="errorMessage"
      class="state-card state-card--error unavailable-card"
      role="alert"
    >
      <strong>Tautan Tidak Tersedia</strong>
      <p>{{ errorMessage }}</p>
      <button
        class="button button--secondary"
        type="button"
        @click="resolveShare"
      >
        Coba Lagi
      </button>
    </section>

    <template v-else-if="share">
      <section
        class="rider-status-card"
        :class="{ 'rider-status-card--sos': share.status === 'sos' }"
        aria-labelledby="rider-status-title"
      >
        <div class="rider-status-card__heading">
          <div>
            <p class="technical-label">Rider Terdaftar</p>
            <h2 id="rider-status-title">{{ share.riderDisplayName }}</h2>
          </div>
          <span class="share-status" :class="`share-status--${share.status}`">
            <GIcon
              :name="share.status === 'sos' ? 'sos' : 'radar'"
              size="xs"
              :filled="share.status === 'sos'"
            />
            <span>{{ statusLabel(share.status) }}</span>
          </span>
        </div>

        <p v-if="share.status === 'sos'" class="sos-notice">
          Rider secara sadar menekan tombol SOS Darurat di aplikasi GowesKit.
          Tetap tenang dan segera hubungi rider secara langsung.
        </p>

        <dl class="share-facts">
          <div>
            <dt>Mulai Gowes</dt>
            <dd>{{ formatDate(share.startedAt) }}</dd>
          </div>
          <div>
            <dt>Estimasi Selesai</dt>
            <dd>{{ formatDate(share.expectedEndAt) }}</dd>
          </div>
          <div>
            <dt>Status Terakhir</dt>
            <dd>
              {{
                share.sosTriggeredAt
                  ? `SOS ditandai pada ${formatDate(share.sosTriggeredAt)}`
                  : share.endedAt
                    ? `Selesai pada ${formatDate(share.endedAt)}`
                    : 'Sesi masih aktif berjalan'
              }}
            </dd>
          </div>
          <div>
            <dt>Tautan Kedaluwarsa</dt>
            <dd>{{ formatDate(share.shareExpiresAt) }}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="location-title">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Snapshot Koordinat</p>
            <h2 id="location-title">Lokasi Terakhir Terdata</h2>
          </div>
          <span class="not-live-chip">Snapshot GPS</span>
        </div>

        <article v-if="share.lastLocation" class="location-card">
          <div class="location-marker" aria-hidden="true">
            <GIcon name="pin" size="sm" color="#EF4444" />
          </div>
          <div>
            <strong>
              {{ formatCoordinate(share.lastLocation.coordinate.latitude) }},
              {{ formatCoordinate(share.lastLocation.coordinate.longitude) }}
            </strong>
            <p>
              Terekam pada
              {{ formatDate(share.lastLocation.recordedAt) }} dengan akurasi
              {{ formatAccuracy(share.lastLocation.accuracyMeters) }}.
            </p>
            <p class="snapshot-note">
              Rider mungkin telah berpindah sejak koordinat ini dikirimkan.
              Halaman ini tidak melacak posisi secara kontinu demi menjaga
              privasi dan daya baterai rider.
            </p>
          </div>
        </article>
        <div v-else class="state-card empty-location">
          <strong>Belum Ada Koordinat yang Dikirimkan</strong>
          <p>
            Rider telah memulai sesi keselamatan tetapi belum memperbarui titik
            koordinat GPS.
          </p>
        </div>
      </section>

      <button
        class="button button--secondary refresh-button"
        type="button"
        @click="resolveShare"
      >
        <GIcon name="radar" size="xs" />
        <span>Muat Ulang Pembaruan Terkini</span>
      </button>
      <p class="fragment-note">
        Demi privasi dan keamanan, token rahasia tautan ini tersimpan pada
        fragmen browser (#) dan hanya dikirimkan via payload permintaan
        terlindungi.
      </p>
    </template>
  </div>
</template>

<style scoped>
.share-page {
  max-width: 48rem;
  margin: 0 auto;
  gap: 1.25rem;
}

.public-warning {
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 1rem;
  border: 1px solid rgb(194 65 42 / 25%);
  border-radius: 1rem;
  background: rgb(255 140 117 / 12%);
  gap: 0.75rem;
}

.public-warning > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--color-coral);
  font-weight: 900;
}

.public-warning p,
.unavailable-card p,
.empty-location p,
.fragment-note,
.location-card p {
  margin: 0;
  color: var(--color-asphalt);
  font-size: 0.84rem;
  line-height: 1.55;
}

.unavailable-card {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
}

.rider-status-card {
  overflow: hidden;
  border: 2px solid var(--color-chain-lime);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
}

.rider-status-card--sos {
  border-color: var(--color-coral);
}

.rider-status-card__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  padding: 1.2rem;
  gap: 1rem;
}

.rider-status-card__heading h2 {
  margin: 0.25rem 0 0;
  font-size: clamp(1.8rem, 8vw, 2.8rem);
  letter-spacing: -0.045em;
}

.share-status,
.not-live-chip {
  display: inline-flex;
  padding: 0.4rem 0.6rem;
  border-radius: 0.6rem;
  background: var(--color-sand);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  font-weight: 800;
}

.share-status--active {
  background: var(--color-chain-lime);
}

.share-status--sos {
  background: var(--color-coral);
}

.sos-notice {
  margin: 0;
  padding: 0.9rem 1.2rem;
  background: rgb(255 140 117 / 20%);
  color: #752719;
  font-weight: 750;
  line-height: 1.5;
}

.share-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--color-sand);
}

.share-facts div {
  min-width: 0;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--color-sand);
}

.share-facts div:nth-child(odd) {
  border-right: 1px solid var(--color-sand);
}

.share-facts dt {
  margin-bottom: 0.3rem;
  color: var(--color-asphalt);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.share-facts dd {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}

.not-live-chip {
  background: var(--color-sky);
}

.location-card {
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 1.2rem;
  border: 1px solid rgb(41 136 165 / 25%);
  border-radius: var(--radius-card);
  background: var(--color-white);
  box-shadow: var(--shadow-card);
  gap: 0.9rem;
}

.location-marker {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 0.7rem solid var(--color-sky);
  border-radius: 50% 50% 50% 0;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0;
  transform: rotate(-45deg);
}

.location-card strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.location-card .snapshot-note {
  margin-top: 0.55rem;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: rgb(142 221 244 / 18%);
}

.empty-location {
  display: grid;
  gap: 0.4rem;
}

.refresh-button {
  justify-self: start;
}

.fragment-note {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-sand);
  font-size: 0.72rem;
}

@media (max-width: 430px) {
  .rider-status-card__heading {
    display: grid;
  }

  .share-facts {
    grid-template-columns: 1fr;
  }

  .share-facts div:nth-child(odd) {
    border-right: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .location-marker {
    transform: none;
  }
}
</style>
