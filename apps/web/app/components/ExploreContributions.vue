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
const reviews = ref<PublicPlaceReview[]>([]);
const routeReports = ref<PublicRouteReport[]>([]);
const hazards = ref<PublicHazardReport[]>([]);
const publicLoading = ref(true);
const publicError = ref('');
const submitting = ref(false);
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
    submissionMessage.value = `Review ${response.contribution.moderationStatus}. It becomes public only after approval.`;
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
    submissionMessage.value = `Route report ${response.contribution.moderationStatus}. It becomes public only after approval.`;
  } catch (error: unknown) {
    submissionError.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function submitHazard(): Promise<void> {
  if (props.selectedItem === null) return;
  resetMessages();
  submitting.value = true;
  try {
    const response = await api<ContributionSubmissionResponse>('/hazards', {
      method: 'POST',
      body: {
        routeId:
          props.selectedItem.kind === 'route' ? props.selectedItem.id : null,
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
    submissionMessage.value = `Hazard report ${response.contribution.moderationStatus}. It becomes public only after approval.`;
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
    gpxError.value = 'GPX file is larger than the 2 MB limit.';
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

watch(
  () => props.selectedItem?.id,
  () => {
    resetMessages();
    updateHazardCoordinate();
    void loadApprovedContributions();
  },
);

onMounted(async () => {
  if (!initialized.value) await refresh();
  updateHazardCoordinate();
  await loadApprovedContributions();
});
</script>

<template>
  <section class="contribution-shell" aria-labelledby="contribution-title">
    <header class="contribution-heading">
      <div>
        <p class="section-heading__eyebrow">Community knowledge</p>
        <h2 id="contribution-title">Reviews, conditions, and hazards</h2>
      </div>
      <span class="status-chip status-chip--sky">Moderated</span>
    </header>
    <p class="contribution-intro">
      Public lists contain approved reports only. Reporter identity is private,
      and every hazard point means “reported hazard”—never a live rider.
    </p>

    <p v-if="publicLoading" class="state-card" role="status">
      Loading approved local reports…
    </p>
    <p
      v-else-if="publicError"
      class="state-card state-card--error"
      role="alert"
    >
      {{ publicError }}
    </p>

    <div v-else class="contribution-grid">
      <article class="contribution-panel">
        <h3>
          {{
            selectedItem === null
              ? 'Select a map result'
              : `Approved notes for ${selectedItem.name}`
          }}
        </h3>
        <p v-if="selectedItem === null" class="muted-copy">
          Select a place or route above to read and submit focused information.
        </p>
        <template v-else-if="selectedItem.kind === 'place'">
          <p v-if="reviews.length === 0" class="muted-copy">
            No approved reviews yet.
          </p>
          <ul v-else class="contribution-list">
            <li v-for="review in reviews" :key="review.id">
              <strong>{{ review.rating }} / 5</strong>
              <span>{{ review.notes }}</span>
              <small>{{ contributionDate(review.createdAt) }}</small>
            </li>
          </ul>
        </template>
        <template v-else>
          <p v-if="routeReports.length === 0" class="muted-copy">
            No approved route reports yet.
          </p>
          <ul v-else class="contribution-list">
            <li v-for="report in routeReports" :key="report.id">
              <strong>{{ contributionLabel(report.reportType) }}</strong>
              <span>{{ report.notes }}</span>
              <small>{{ contributionDate(report.observedAt) }}</small>
            </li>
          </ul>
          <p v-if="selectedRouteHazards.length === 0" class="muted-copy">
            No approved hazards are linked to this route.
          </p>
          <ul v-else class="contribution-list contribution-list--hazard">
            <li v-for="hazard in selectedRouteHazards" :key="hazard.id">
              <strong>
                {{ contributionLabel(hazard.severity) }} ·
                {{ contributionLabel(hazard.hazardType) }}
              </strong>
              <span>{{ hazard.notes }}</span>
              <small
                >Reported hazard marker ·
                {{ contributionDate(hazard.observedAt) }}</small
              >
            </li>
          </ul>
        </template>
      </article>

      <article class="contribution-panel contribution-panel--forms">
        <h3>Contribute what you observed</h3>
        <p v-if="selectedItem === null" class="muted-copy">
          Select a public map item first. Your search center is never copied
          into a report.
        </p>
        <div v-else-if="!initialized" class="state-card" role="status">
          Checking contribution permission…
        </div>
        <div v-else-if="!user" class="permission-card">
          <p>
            Sign in to submit. Approved information stays anonymous publicly.
          </p>
          <NuxtLink class="button button--secondary" to="/login"
            >Sign in</NuxtLink
          >
        </div>
        <div v-else class="contribution-forms">
          <form
            v-if="selectedItem.kind === 'place'"
            class="compact-form"
            @submit.prevent="submitReview"
          >
            <h4>Review this place</h4>
            <label>
              Rating
              <select v-model="rating">
                <option
                  v-for="value in [5, 4, 3, 2, 1]"
                  :key="value"
                  :value="value"
                >
                  {{ value }} / 5
                </option>
              </select>
            </label>
            <label>
              Helpful notes
              <textarea v-model="reviewNotes" required maxlength="1000" />
            </label>
            <button
              class="button button--primary"
              :disabled="submitting"
              type="submit"
            >
              Submit review
            </button>
          </form>

          <form v-else class="compact-form" @submit.prevent="submitRouteReport">
            <h4>Report route condition</h4>
            <label>
              Report type
              <select v-model="reportType">
                <option
                  v-for="value in ROUTE_REPORT_TYPES"
                  :key="value"
                  :value="value"
                >
                  {{ contributionLabel(value) }}
                </option>
              </select>
            </label>
            <label>
              What did you observe?
              <textarea v-model="reportNotes" required maxlength="1000" />
            </label>
            <button
              class="button button--primary"
              :disabled="submitting"
              type="submit"
            >
              Submit route report
            </button>
          </form>

          <form class="compact-form" @submit.prevent="submitHazard">
            <h4>Mark a hazard</h4>
            <p class="privacy-note">
              These coordinates describe the hazard. They start from the
              selected public map item, not your location.
            </p>
            <div class="compact-pair">
              <label>
                Type
                <select v-model="hazardType">
                  <option
                    v-for="value in HAZARD_TYPES"
                    :key="value"
                    :value="value"
                  >
                    {{ contributionLabel(value) }}
                  </option>
                </select>
              </label>
              <label>
                Severity
                <select v-model="hazardSeverity">
                  <option
                    v-for="value in HAZARD_SEVERITIES"
                    :key="value"
                    :value="value"
                  >
                    {{ value }}
                  </option>
                </select>
              </label>
            </div>
            <div class="compact-pair">
              <label>
                Longitude
                <input
                  v-model.number="hazardLongitude"
                  type="number"
                  min="-180"
                  max="180"
                  step="0.000001"
                  required
                />
              </label>
              <label>
                Latitude
                <input
                  v-model.number="hazardLatitude"
                  type="number"
                  min="-90"
                  max="90"
                  step="0.000001"
                  required
                />
              </label>
            </div>
            <label>
              What should riders know?
              <textarea v-model="hazardNotes" required maxlength="1000" />
            </label>
            <button
              class="button button--secondary"
              :disabled="submitting"
              type="submit"
            >
              Submit hazard
            </button>
          </form>
          <p v-if="submissionMessage" class="form-message" role="status">
            {{ submissionMessage }}
          </p>
          <p
            v-if="submissionError"
            class="form-message form-message--error"
            role="alert"
          >
            {{ submissionError }}
          </p>
        </div>
      </article>
    </div>

    <div class="contribution-grid contribution-grid--lower">
      <article class="contribution-panel">
        <h3>Approved hazard board</h3>
        <p v-if="hazards.length === 0" class="muted-copy">
          No approved hazard markers are available.
        </p>
        <ul v-else class="contribution-list contribution-list--hazard">
          <li v-for="hazard in hazards.slice(0, 6)" :key="hazard.id">
            <strong>
              {{ contributionLabel(hazard.severity) }} ·
              {{ contributionLabel(hazard.hazardType) }}
            </strong>
            <span>{{ hazard.notes }}</span>
            <small>
              Reported hazard marker
              {{ hazard.coordinate.longitude.toFixed(4) }},
              {{ hazard.coordinate.latitude.toFixed(4) }}
            </small>
          </li>
        </ul>
      </article>

      <article class="contribution-panel">
        <h3>Check a GPX file</h3>
        <p class="muted-copy">
          Parses up to 2 MB and 10,000 points for a route preview. Import does
          not publish a route or reveal your location.
        </p>
        <div v-if="!initialized" class="state-card" role="status">
          Checking permission…
        </div>
        <div v-else-if="!user" class="permission-card">
          <p>Sign in before importing a GPX preview.</p>
          <NuxtLink class="button button--secondary" to="/login"
            >Sign in</NuxtLink
          >
        </div>
        <form v-else class="compact-form" @submit.prevent="importGpx">
          <label>
            GPX file
            <input
              type="file"
              accept=".gpx,application/gpx+xml,application/xml,text/xml"
              @change="chooseGpx"
            />
          </label>
          <button
            class="button button--secondary"
            type="submit"
            :disabled="gpxLoading || gpxContent === ''"
          >
            {{ gpxLoading ? 'Checking GPX…' : 'Import preview' }}
          </button>
          <p
            v-if="gpxError"
            class="form-message form-message--error"
            role="alert"
          >
            {{ gpxError }}
          </p>
          <dl v-if="gpxResult" class="gpx-result" role="status">
            <div>
              <dt>File</dt>
              <dd>{{ gpxResult.fileName }}</dd>
            </div>
            <div>
              <dt>Points</dt>
              <dd>{{ gpxResult.pointCount }}</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd>{{ (gpxResult.distanceMeters / 1000).toFixed(1) }} km</dd>
            </div>
          </dl>
        </form>
      </article>
    </div>
  </section>
</template>

<style scoped>
.contribution-shell {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1rem, 3vw, 1.75rem);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: var(--color-surface);
}

.contribution-heading,
.contribution-grid,
.compact-pair,
.gpx-result {
  display: grid;
  gap: 1rem;
}

.contribution-heading {
  grid-template-columns: 1fr auto;
  align-items: start;
}

.contribution-heading h2,
.contribution-panel h3,
.compact-form h4,
.contribution-intro,
.muted-copy,
.privacy-note,
.permission-card p {
  margin: 0;
}

.contribution-intro,
.muted-copy,
.privacy-note,
.contribution-list small {
  color: var(--color-text-muted);
}

.contribution-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.contribution-grid--lower {
  align-items: start;
}

.contribution-panel {
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface-raised, #fff);
}

.contribution-list {
  display: grid;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.contribution-list li {
  display: grid;
  gap: 0.3rem;
  padding: 0.8rem;
  border-radius: 0.75rem;
  background: var(--color-background);
}

.contribution-list--hazard li {
  border-left: 4px solid var(--color-warning, #d7922f);
}

.contribution-forms,
.compact-form,
.permission-card {
  display: grid;
  gap: 0.9rem;
}

.compact-form + .compact-form {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.compact-form label {
  display: grid;
  gap: 0.4rem;
  font-weight: 700;
}

.compact-form input,
.compact-form select,
.compact-form textarea {
  width: 100%;
  min-width: 0;
  padding: 0.7rem;
  border: 1px solid var(--color-border-strong, var(--color-border));
  border-radius: 0.65rem;
  background: #fff;
  color: inherit;
  font: inherit;
}

.compact-form textarea {
  min-height: 6rem;
  resize: vertical;
}

.compact-pair,
.gpx-result {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.privacy-note {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--color-sky-soft, #eef8ff);
  font-size: 0.9rem;
}

.gpx-result div {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--color-background);
}

.gpx-result dt {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
}

.gpx-result dd {
  margin: 0.2rem 0 0;
  font-weight: 800;
}

@media (max-width: 760px) {
  .contribution-grid,
  .compact-pair {
    grid-template-columns: 1fr;
  }
}
</style>
