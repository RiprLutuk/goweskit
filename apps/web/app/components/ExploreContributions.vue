<script setup lang="ts">
import {
  GPX_MAX_FILE_BYTES,
  HAZARD_SEVERITIES,
  HAZARD_TYPES,
  ROUTE_REPORT_TYPES,
  type ContributionSubmissionResponse,
  type GpxImportResult,
  type NearbyPlace,
  type NearbyRoute,
  type PublicHazardReport,
  type PublicHazardsResponse,
  type PublicPlaceReview,
  type PublicPlaceReviewsResponse,
  type PublicRouteReport,
  type PublicRouteReportsResponse,
} from '@goweskit/contracts';

import {
  contributionCoordinateForItem,
  contributionDate,
  contributionLabel,
} from '../explore-contribution-display.js';

const props = defineProps<{
  selectedItem: NearbyPlace | NearbyRoute | null;
}>();

const api = useApi();
const { user, initialized, refresh } = useAuth();

type ActiveTab = 'reviews' | 'hazard' | 'gpx';
const activeTab = ref<ActiveTab>(props.selectedItem ? 'reviews' : 'hazard');

const reviews = ref<PublicPlaceReview[]>([]);
const routeReports = ref<PublicRouteReport[]>([]);
const hazards = ref<PublicHazardReport[]>([]);
const publicLoading = ref(true);
const publicError = ref('');
const submitting = ref(false);
const locatingHazard = ref(false);
const submissionError = ref('');
const submissionMessage = ref('');
const rating = ref(5);
const reviewNotes = ref('');
const reportType = ref<(typeof ROUTE_REPORT_TYPES)[number]>('condition');
const reportNotes = ref('');
const hazardType = ref<(typeof HAZARD_TYPES)[number]>('road_damage');
const hazardSeverity = ref<(typeof HAZARD_SEVERITIES)[number]>('caution');
const hazardLongitude = ref(107.6191);
const hazardLatitude = ref(-6.9175);
const hazardNotes = ref('');
const gpxFileName = ref('');
const gpxContent = ref('');
const gpxLoading = ref(false);
const gpxError = ref('');
const gpxResult = ref<GpxImportResult | null>(null);

const selectedRouteHazards = computed(() => {
  if (props.selectedItem?.kind !== 'route') return [];
  return hazards.value.filter(
    ({ routeId }) => routeId === props.selectedItem?.id,
  );
});

function resetMessages(): void {
  submissionError.value = '';
  submissionMessage.value = '';
}

function updateHazardCoordinate(): void {
  if (props.selectedItem === null) return;
  const coordinate = contributionCoordinateForItem(props.selectedItem);
  hazardLongitude.value = coordinate.longitude;
  hazardLatitude.value = coordinate.latitude;
}

function useCurrentGpsForHazard(): void {
  if (!('geolocation' in navigator)) return;
  locatingHazard.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      hazardLongitude.value = pos.coords.longitude;
      hazardLatitude.value = pos.coords.latitude;
      locatingHazard.value = false;
    },
    () => {
      locatingHazard.value = false;
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
  );
}

async function loadApprovedContributions(): Promise<void> {
  publicLoading.value = true;
  publicError.value = '';
  reviews.value = [];
  routeReports.value = [];
  try {
    const hazardResponse = await api<PublicHazardsResponse>('/hazards');
    hazards.value = hazardResponse.hazards;
    if (props.selectedItem?.kind === 'place') {
      const response = await api<PublicPlaceReviewsResponse>(
        `/places/${props.selectedItem.id}/reviews`,
      );
      reviews.value = response.reviews;
    } else if (props.selectedItem?.kind === 'route') {
      const response = await api<PublicRouteReportsResponse>(
        `/routes/${props.selectedItem.id}/reports`,
      );
      routeReports.value = response.reports;
    }
  } catch (error: unknown) {
    publicError.value = getApiErrorMessage(error);
  } finally {
    publicLoading.value = false;
  }
}

async function submitReview(): Promise<void> {
  if (props.selectedItem?.kind !== 'place') return;
  resetMessages();
  submitting.value = true;
  try {
    const response = await api<ContributionSubmissionResponse>(
      `/places/${props.selectedItem.id}/reviews`,
      {
        method: 'POST',
        body: { rating: rating.value, notes: reviewNotes.value },
      },
    );
    reviewNotes.value = '';
    submissionMessage.value = `Ulasan berhasil dikirim (${response.contribution.moderationStatus}).`;
  } catch (error: unknown) {
    submissionError.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function submitRouteReport(): Promise<void> {
  if (props.selectedItem?.kind !== 'route') return;
  resetMessages();
  submitting.value = true;
  try {
    const response = await api<ContributionSubmissionResponse>(
      `/routes/${props.selectedItem.id}/reports`,
      {
        method: 'POST',
        body: {
          reportType: reportType.value,
          notes: reportNotes.value,
          observedAt: null,
        },
      },
    );
    reportNotes.value = '';
    submissionMessage.value = `Laporan kondisi jalur terkirim (${response.contribution.moderationStatus}).`;
  } catch (error: unknown) {
    submissionError.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function submitHazard(): Promise<void> {
  resetMessages();
  submitting.value = true;
  try {
    const response = await api<ContributionSubmissionResponse>('/hazards', {
      method: 'POST',
      body: {
        routeId:
          props.selectedItem?.kind === 'route' ? props.selectedItem.id : null,
        hazardType: hazardType.value,
        severity: hazardSeverity.value,
        coordinate: {
          longitude: hazardLongitude.value,
          latitude: hazardLatitude.value,
        },
        notes: hazardNotes.value,
        observedAt: null,
      },
    });
    hazardNotes.value = '';
    submissionMessage.value = `Laporan bahaya jalan terkirim (${response.contribution.moderationStatus}).`;
  } catch (error: unknown) {
    submissionError.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function chooseGpx(event: Event): Promise<void> {
  gpxError.value = '';
  gpxResult.value = null;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file === undefined) return;
  if (file.size > GPX_MAX_FILE_BYTES) {
    gpxError.value = 'Ukuran file GPX maksimal 2 MB.';
    input.value = '';
    return;
  }
  gpxFileName.value = file.name;
  gpxContent.value = await file.text();
}

async function importGpx(): Promise<void> {
  if (gpxFileName.value === '' || gpxContent.value === '') return;
  gpxLoading.value = true;
  gpxError.value = '';
  gpxResult.value = null;
  try {
    gpxResult.value = await api<GpxImportResult>('/explore/gpx/import', {
      method: 'POST',
      body: { fileName: gpxFileName.value, content: gpxContent.value },
    });
  } catch (error: unknown) {
    gpxError.value = getApiErrorMessage(error);
  } finally {
    gpxLoading.value = false;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/^Practice\s+/i, '')
    .replace(/\s*·\s*demo\s+data/gi, '')
    .replace(/\bdemo\b/gi, '')
    .trim();
}

watch(
  () => props.selectedItem?.id,
  () => {
    resetMessages();
    updateHazardCoordinate();
    void loadApprovedContributions();
    if (props.selectedItem) activeTab.value = 'reviews';
  },
);

onMounted(async () => {
  if (!initialized.value) await refresh();
  updateHazardCoordinate();
  await loadApprovedContributions();
});
</script>

<template>
  <div class="contribution-modal-wrap">
    <!-- Clean Segmented Navigation Tabs -->
    <div class="modal-segmented-control" role="tablist">
      <button
        class="seg-btn"
        :class="{ 'seg-btn--active': activeTab === 'reviews' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'reviews'"
        @click="activeTab = 'reviews'"
      >
        <GIcon name="community" size="xs" />
        <span>{{ selectedItem ? 'Ulasan' : 'Komunitas' }}</span>
      </button>
      <button
        class="seg-btn"
        :class="{ 'seg-btn--active': activeTab === 'hazard' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'hazard'"
        @click="activeTab = 'hazard'"
      >
        <GIcon name="shield" size="xs" color="#EF4444" filled />
        <span>Lapor Bahaya</span>
      </button>
      <button
        class="seg-btn"
        :class="{ 'seg-btn--active': activeTab === 'gpx' }"
        type="button"
        role="tab"
        :aria-selected="activeTab === 'gpx'"
        @click="activeTab = 'gpx'"
      >
        <GIcon name="route" size="xs" />
        <span>File GPX</span>
      </button>
    </div>

    <!-- TAB 1: REVIEWS & COMMUNITY REPORTS -->
    <section v-if="activeTab === 'reviews'" class="tab-pane">
      <!-- A. If a place / route is selected -->
      <div v-if="selectedItem" class="selected-item-box">
        <div class="selected-item-tag">
          {{ selectedItem.kind === 'place' ? 'Spot Terpilih' : 'Rute Terpilih' }}
        </div>
        <strong class="selected-item-name">{{ selectedItem.name.replace(/^Demo\s+/i, '') }}</strong>
      </div>

      <!-- Approved Reviews List -->
      <div v-if="publicLoading" class="mini-status-card">Memuat laporan komunitas…</div>
      <div v-else-if="publicError" class="mini-status-card mini-status-card--error">{{ publicError }}</div>
      <div v-else class="reviews-stack">
        <!-- Place Reviews -->
        <template v-if="selectedItem?.kind === 'place'">
          <div v-if="reviews.length === 0" class="empty-bulletin">
            Belum ada ulasan komunitas untuk tempat ini.
          </div>
          <div v-for="review in reviews" :key="review.id" class="review-card">
            <div class="review-header">
              <span class="rating-badge">★ {{ review.rating }}.0</span>
              <small class="review-date">{{ contributionDate(review.createdAt) }}</small>
            </div>
            <p class="review-text">{{ cleanText(review.notes) }}</p>
          </div>

          <!-- Add Review Form -->
          <div v-if="user" class="add-review-box">
            <h4>Tulis Ulasan</h4>
            <form class="clean-form" @submit.prevent="submitReview">
              <div class="form-row-compact">
                <label>
                  Rating:
                  <select v-model="rating">
                    <option v-for="val in [5, 4, 3, 2, 1]" :key="val" :value="val">★ {{ val }} Bintang</option>
                  </select>
                </label>
              </div>
              <textarea
                v-model="reviewNotes"
                placeholder="Tulis ulasan fasilitas parkir, ketersediaan pompa, atau keramahan bengkel..."
                required
                maxlength="500"
              />
              <button class="button button--primary button--full" :disabled="submitting" type="submit">
                {{ submitting ? 'Mengirim…' : 'Kirim Ulasan' }}
              </button>
            </form>
          </div>
          <div v-else class="login-prompt-banner">
            <span>Masuk untuk menulis ulasan tempat ini.</span>
            <NuxtLink class="button button--secondary button--sm" to="/login">Sign In</NuxtLink>
          </div>
        </template>

        <!-- Route Reports & Route Hazards -->
        <template v-else-if="selectedItem?.kind === 'route'">
          <div v-if="routeReports.length === 0 && selectedRouteHazards.length === 0" class="empty-bulletin">
            Belum ada laporan kendala pada rute ini.
          </div>
          <div v-for="report in routeReports" :key="report.id" class="review-card">
            <div class="review-header">
              <span class="pill-tag">{{ contributionLabel(report.reportType) }}</span>
              <small class="review-date">{{ contributionDate(report.observedAt) }}</small>
            </div>
            <p class="review-text">{{ cleanText(report.notes) }}</p>
          </div>

          <div v-for="hz in selectedRouteHazards" :key="hz.id" class="review-card review-card--hazard">
            <div class="review-header">
              <span class="hazard-tag">⚠️ {{ contributionLabel(hz.severity) }} · {{ contributionLabel(hz.hazardType) }}</span>
              <small class="review-date">{{ contributionDate(hz.observedAt) }}</small>
            </div>
            <p class="review-text">{{ cleanText(hz.notes) }}</p>
          </div>

          <!-- Add Route Report Form -->
          <div v-if="user" class="add-review-box">
            <h4>Lapor Kondisi Jalur Ini</h4>
            <form class="clean-form" @submit.prevent="submitRouteReport">
              <select v-model="reportType">
                <option v-for="val in ROUTE_REPORT_TYPES" :key="val" :value="val">
                  {{ contributionLabel(val) }}
                </option>
              </select>
              <textarea
                v-model="reportNotes"
                placeholder="Ceritakan kondisi jalan, permukaan aspal/tanah, atau perbaikan jalan..."
                required
                maxlength="500"
              />
              <button class="button button--primary button--full" :disabled="submitting" type="submit">
                {{ submitting ? 'Mengirim…' : 'Kirim Laporan Rute' }}
              </button>
            </form>
          </div>
          <div v-else class="login-prompt-banner">
            <span>Masuk untuk melaporkan kondisi rute.</span>
            <NuxtLink class="button button--secondary button--sm" to="/login">Sign In</NuxtLink>
          </div>
        </template>

        <!-- No Item Selected: Show General Community Hazards Board -->
        <template v-else>
          <div class="bulletin-header">
            <strong>Pantauan Bahaya Jalan Terkini</strong>
            <span class="count-pill">{{ hazards.length }}</span>
          </div>
          <div v-if="hazards.length === 0" class="empty-bulletin">Tidak ada laporan bahaya aktif saat ini.</div>
          <div v-for="hz in hazards.slice(0, 6)" :key="hz.id" class="review-card review-card--hazard">
            <div class="review-header">
              <span class="hazard-tag">⚠️ {{ contributionLabel(hz.severity) }} · {{ contributionLabel(hz.hazardType) }}</span>
              <small class="review-date">{{ contributionDate(hz.observedAt) }}</small>
            </div>
            <p class="review-text">{{ cleanText(hz.notes) }}</p>
          </div>
        </template>
      </div>
    </section>

    <!-- TAB 2: REPORT HAZARD FORM -->
    <section v-else-if="activeTab === 'hazard'" class="tab-pane">
      <div class="form-card-box">
        <p class="tab-intro-copy">
          Laporkan jalan berlubang, tumpahan oli, atau pohon tumbang demi keselamatan sesama pesepeda.
        </p>

        <div v-if="!user" class="login-prompt-banner">
          <span>Masuk untuk mengirimkan laporan bahaya jalan.</span>
          <NuxtLink class="button button--secondary button--sm" to="/login">Sign In</NuxtLink>
        </div>

        <form v-else class="clean-form" @submit.prevent="submitHazard">
          <!-- Location Source & GPS Auto-Detect Header -->
          <div class="hazard-location-picker">
            <div class="location-picker-header">
              <span class="picker-label">Titik Koordinat Bahaya:</span>
              <span class="picker-coords font-mono">{{ hazardLatitude.toFixed(4) }}, {{ hazardLongitude.toFixed(4) }}</span>
            </div>
            <div class="location-picker-actions">
              <button
                class="location-gps-btn"
                type="button"
                :disabled="locatingHazard"
                @click="useCurrentGpsForHazard"
              >
                <GIcon name="pin" size="xs" />
                <span>{{ locatingHazard ? 'Mengambil GPS…' : 'Gunakan Lokasi GPS Saya Saat Ini' }}</span>
              </button>
              <span v-if="props.selectedItem" class="selected-target-hint">
                <GIcon name="route" size="xs" /> Terkait Rute: {{ props.selectedItem.name.replace(/^Demo\s+/i, '') }}
              </span>
            </div>
          </div>

          <div class="form-grid-2">
            <label>
              Jenis Bahaya
              <select v-model="hazardType">
                <option v-for="val in HAZARD_TYPES" :key="val" :value="val">
                  {{ contributionLabel(val) }}
                </option>
              </select>
            </label>
            <label>
              Tingkat Urgensi
              <select v-model="hazardSeverity">
                <option v-for="val in HAZARD_SEVERITIES" :key="val" :value="val">
                  {{ val }}
                </option>
              </select>
            </label>
          </div>

          <label>
            Detail Catatan
            <textarea
              v-model="hazardNotes"
              placeholder="Jelaskan bahaya secara spesifik, misal: 'Lubang dalam di sebelah kiri turunan setelah tikungan'..."
              required
              maxlength="500"
            />
          </label>

          <button class="button button--primary button--full" :disabled="submitting" type="submit">
            {{ submitting ? 'Mengirimkan…' : 'Kirim Laporan Bahaya' }}
          </button>
        </form>
      </div>
    </section>

    <!-- TAB 3: UPLOAD GPX FILE -->
    <section v-else-if="activeTab === 'gpx'" class="tab-pane">
      <div class="form-card-box">
        <p class="tab-intro-copy">
          Upload file rute GPX (maks. 2 MB) untuk mengecek jarak, elevasi, dan koordinat jalur.
        </p>

        <div v-if="!user" class="login-prompt-banner">
          <span>Masuk akun terlebih dahulu untuk preview file GPX.</span>
          <NuxtLink class="button button--secondary button--sm" to="/login">Sign In</NuxtLink>
        </div>

        <form v-else class="clean-form" @submit.prevent="importGpx">
          <div class="gpx-dropzone">
            <input
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              class="gpx-file-input"
              @change="chooseGpx"
            />
            <div class="gpx-dropzone-content">
              <div class="gpx-icon-box">
                <GIcon name="route" size="lg" color="#0F766E" />
              </div>
              <span class="gpx-name">{{ gpxFileName || 'Pilih atau sentuh file GPX' }}</span>
              <span class="gpx-hint">Format .gpx hingga 10.000 titik koordinat</span>
            </div>
          </div>

          <button
            class="button button--primary button--full"
            type="submit"
            :disabled="gpxLoading || gpxContent === ''"
          >
            {{ gpxLoading ? 'Memproses GPX…' : 'Periksa & Preview GPX' }}
          </button>

          <p v-if="gpxError" class="form-message form-message--error" role="alert">
            {{ gpxError }}
          </p>

          <!-- Result Card -->
          <div v-if="gpxResult" class="gpx-summary-card">
            <div class="summary-metric">
              <span class="metric-label">Nama File</span>
              <strong>{{ gpxResult.fileName }}</strong>
            </div>
            <div class="summary-metric">
              <span class="metric-label">Jumlah Titik</span>
              <strong>{{ gpxResult.pointCount.toLocaleString() }} waypoints</strong>
            </div>
            <div class="summary-metric">
              <span class="metric-label">Total Jarak</span>
              <strong class="highlight-metric">{{ (gpxResult.distanceMeters / 1000).toFixed(1) }} km</strong>
            </div>
          </div>
        </form>
      </div>
    </section>

    <!-- Global Feedback Notification -->
    <p v-if="submissionMessage" class="form-message form-message--success" role="status">
      ✓ {{ submissionMessage }}
    </p>
    <p v-if="submissionError" class="form-message form-message--error" role="alert">
      {{ submissionError }}
    </p>
  </div>
</template>

<style scoped>
.contribution-modal-wrap {
  display: grid;
  gap: 0.85rem;
}

/* Clean Segmented Control */
.modal-segmented-control {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 0.85rem;
  background: var(--color-sand);
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 0.45rem 0.3rem;
  border-radius: 0.65rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-asphalt);
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
  text-align: center;
}

.seg-btn--active {
  background: var(--color-white);
  color: var(--color-ink);
  box-shadow: 0 2px 8px rgb(23 32 42 / 10%);
}

.tab-pane {
  display: grid;
  gap: 0.75rem;
}

.tab-intro-copy {
  margin: 0;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.selected-item-box {
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  background: rgb(201 243 106 / 25%);
  border: 1px solid rgb(201 243 106 / 60%);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.selected-item-tag {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-ink);
}

.selected-item-name {
  font-size: 0.95rem;
  color: var(--color-ink);
}

.reviews-stack {
  display: grid;
  gap: 0.55rem;
}

.review-card {
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  display: grid;
  gap: 0.3rem;
}

.review-card--hazard {
  border-left: 3px solid #ef4444;
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rating-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 900;
  color: #d97706;
}

.pill-tag {
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
  background: var(--color-sand);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: capitalize;
}

.hazard-tag {
  font-size: 0.72rem;
  font-weight: 850;
  color: #dc2626;
  text-transform: capitalize;
}

.review-date {
  font-size: 0.65rem;
  color: var(--color-asphalt);
}

.review-text {
  margin: 0;
  font-size: 0.76rem;
  color: var(--color-ink);
  line-height: 1.35;
}

.bulletin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--color-ink);
}

.count-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background: var(--color-sand);
}

.empty-bulletin {
  padding: 0.85rem;
  text-align: center;
  font-size: 0.76rem;
  color: var(--color-asphalt);
  border-radius: 0.75rem;
  background: var(--color-sand);
}

.add-review-box,
.form-card-box {
  display: grid;
  gap: 0.6rem;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.add-review-box h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 850;
}

.clean-form {
  display: grid;
  gap: 0.55rem;
}

.clean-form label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.clean-form select,
.clean-form input,
.clean-form textarea {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.78rem;
  outline: none;
  box-sizing: border-box;
}

.clean-form textarea {
  min-height: 4.5rem;
  resize: vertical;
}

.clean-form select:focus,
.clean-form input:focus,
.clean-form textarea:focus {
  border-color: var(--color-ink);
}

.hazard-location-picker {
  display: grid;
  gap: 0.35rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  background: var(--color-sand);
}

.location-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
}

.picker-label {
  font-weight: 800;
  color: var(--color-asphalt);
}

.picker-coords {
  font-size: 0.7rem;
  font-weight: 850;
  color: var(--color-ink);
}

.location-picker-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.location-gps-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-asphalt);
  background: var(--color-white);
  font-size: 0.7rem;
  font-weight: 850;
  color: var(--color-ink);
  cursor: pointer;
}

.location-gps-btn:active {
  transform: scale(0.96);
}

.selected-target-hint {
  font-size: 0.68rem;
  color: var(--color-asphalt);
  font-weight: 750;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.login-prompt-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-sand);
  font-size: 0.74rem;
  color: var(--color-ink);
}

/* GPX Dropzone */
.gpx-dropzone {
  position: relative;
  border: 2px dashed var(--color-sand);
  border-radius: 0.85rem;
  padding: 1.25rem 0.85rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 120ms ease;
  background: rgb(255 255 255 / 60%);
}

.gpx-dropzone:hover {
  border-color: var(--color-ink);
}

.gpx-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.gpx-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.gpx-icon {
  font-size: 1.5rem;
}

.gpx-name {
  font-size: 0.82rem;
  font-weight: 850;
  color: var(--color-ink);
}

.gpx-hint {
  font-size: 0.68rem;
  color: var(--color-asphalt);
}

.gpx-summary-card {
  display: grid;
  gap: 0.4rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgb(201 243 106 / 20%);
  border: 1px solid var(--color-chain-lime);
}

.summary-metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
}

.metric-label {
  color: var(--color-asphalt);
}

.highlight-metric {
  color: #0284c7;
  font-family: var(--font-mono);
}

.mini-status-card {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.76rem;
  border-radius: 0.65rem;
  background: var(--color-sand);
}

.mini-status-card--error {
  background: #fef2f2;
  color: #b91c1c;
}

.form-message {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 0.65rem;
  font-size: 0.74rem;
  font-weight: 800;
}

.form-message--success {
  background: rgb(201 243 106 / 35%);
  color: #166534;
}

.form-message--error {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
