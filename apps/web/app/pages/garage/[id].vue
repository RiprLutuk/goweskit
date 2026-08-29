<script setup lang="ts">
import {
  BIKE_SPEC_DEFINITIONS,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import type {
  Bike,
  BikeResponse,
  BikeSpecResponse,
  BikeVisualResponse,
} from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh } = useAuth();
const bike = ref<Bike | null>(null);
const loading = ref(true);
const savingCode = ref<BikeSpecCode | null>(null);
const savingPhoto = ref(false);
const errorMessage = ref('');
const successNotice = ref('');
const activeTab = ref<'specs' | 'components' | 'maintenance'>('specs');
const specGroupFilter = ref('all');
const selections = reactive<Record<string, string>>({});
const showPhotoModal = ref(false);
const photoInputUrl = ref('');

const bikeId = computed(() => String(route.params.id));

onMounted(async () => {
  if (!initialized.value) await refresh();
  if (user.value === null) {
    loading.value = false;
    return;
  }
  await loadBike();
});

async function loadBike(): Promise<void> {
  try {
    bike.value = (await api<BikeResponse>(`/bikes/${bikeId.value}`)).bike;
    photoInputUrl.value = bike.value.photoUrl || '';
    for (const definition of BIKE_SPEC_DEFINITIONS) {
      const spec = bike.value.specs.find(
        ({ standardCode }) => standardCode === definition.code,
      );
      selections[definition.code] =
        spec === undefined
          ? 'missing'
          : spec.knowledge === 'unknown'
            ? 'unknown'
            : (spec.value ?? 'missing');
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function saveSpec(code: BikeSpecCode): Promise<void> {
  const selection = selections[code];
  if (selection === undefined || selection === 'missing') return;
  savingCode.value = code;
  errorMessage.value = '';
  successNotice.value = '';
  try {
    const response = await api<BikeSpecResponse>(
      `/bikes/${bikeId.value}/specs/${code}`,
      {
        method: 'PUT',
        body:
          selection === 'unknown'
            ? { knowledge: 'unknown' }
            : { knowledge: 'known', value: selection },
      },
    );
    if (bike.value !== null) {
      bike.value.specs = [
        ...bike.value.specs.filter(({ standardCode }) => standardCode !== code),
        response.spec,
      ];
      successNotice.value = `Standar ${code.replaceAll('_', ' ')} berhasil disimpan.`;
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    savingCode.value = null;
  }
}

async function saveBikePhoto(): Promise<void> {
  if (!bike.value) return;
  savingPhoto.value = true;
  errorMessage.value = '';
  try {
    const response = await api<BikeVisualResponse>(
      `/bikes/${bikeId.value}/photo`,
      {
        method: 'PUT',
        body: { photoUrl: photoInputUrl.value.trim() || null },
      },
    );
    bike.value.photoUrl = response.bike.photoUrl;
    bike.value.avatarPreset = response.bike.avatarPreset;
    showPhotoModal.value = false;
    successNotice.value = 'Foto sepeda berhasil disimpan ke Cloudflare R2.';
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    savingPhoto.value = false;
  }
}

function handlePhotoFileUpload(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 700_000) {
    errorMessage.value = 'Ukuran foto maksimal 700 KB untuk upload ke Cloudflare R2.';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    if (typeof e.target?.result === 'string') {
      photoInputUrl.value = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

async function deleteBike(): Promise<void> {
  if (!window.confirm('Hapus sepeda ini dari My Garage?')) return;
  try {
    await api(`/bikes/${bikeId.value}`, { method: 'DELETE' });
    await navigateTo('/garage');
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  }
}

function bikeTypeIcon(slug: string): string {
  if (slug === 'mtb_hardtail') return '🌲';
  if (slug === 'folding') return '🧲';
  if (slug === 'road') return '⚡';
  if (slug === 'gravel') return '🌾';
  return '🚲';
}

const filteredDefinitions = computed(() => {
  if (specGroupFilter.value === 'all') return BIKE_SPEC_DEFINITIONS;
  return BIKE_SPEC_DEFINITIONS.filter(
    (d) => d.category === specGroupFilter.value,
  );
});

function specStatus(code: string): 'known' | 'unknown' | 'missing' {
  const sel = selections[code];
  if (sel === 'unknown') return 'unknown';
  if (sel && sel !== 'missing') return 'known';
  return 'missing';
}
</script>

<template>
  <div class="page-stack bike-detail-page">
    <NuxtLink class="back-link" to="/garage">← Kembali ke My Garage</NuxtLink>

    <p v-if="loading" class="state-card" role="status">
      Memuat detail sepeda…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <p>Masuk akun untuk melihat sepeda Anda.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <p
      v-else-if="bike === null"
      class="state-card state-card--error"
      role="alert"
    >
      {{ errorMessage || 'Sepeda tidak ditemukan.' }}
    </p>

    <template v-else>
      <header class="bike-hero-rich">
        <div class="bike-hero-rich__top">
          <!-- Bike Visual with Photo Support (GARAGE-007) -->
          <div
            class="bike-hero-rich__visual"
            role="button"
            tabindex="0"
            title="Klik untuk ubah foto sepeda"
            @click="showPhotoModal = true"
          >
            <img
              v-if="bike.photoUrl"
              :src="bike.photoUrl"
              :alt="bike.nickname"
              class="bike-hero-photo"
            />
            <div v-else class="bike-hero-rich__icon" aria-hidden="true">
              {{ bikeTypeIcon(bike.bicycleType.slug) }}
            </div>
            <span class="photo-edit-badge" aria-hidden="true">📷</span>
          </div>

          <div class="bike-hero-rich__info">
            <span class="status-chip status-chip--lime">{{ bike.bicycleType.name }}</span>
            <h1>{{ bike.nickname }}</h1>
            <p>
              {{
                [bike.brand, bike.model, bike.modelYear]
                  .filter(Boolean)
                  .join(' · ') || 'Custom Build'
              }}
            </p>
          </div>
          <div class="bike-hero-rich__actions">
            <NuxtLink
              class="button button--primary"
              :to="`/upgrade-lab?bike=${bike.id}`"
            >
              ⚡ Cek Upgrade Lab
            </NuxtLink>
            <button
              class="text-button text-button--danger"
              type="button"
              @click="deleteBike"
            >
              Hapus Sepeda
            </button>
          </div>
        </div>

        <div v-if="bike.notes" class="bike-notes-box">
          <strong>Catatan:</strong> {{ bike.notes }}
        </div>
      </header>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-if="successNotice" class="state-card state-card--success" role="status">
        ✓ {{ successNotice }}
      </p>

      <!-- Sub-navigation Tabs -->
      <nav class="bike-tabs-bar" role="tablist" aria-label="Tab manajemen sepeda">
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'specs' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'specs'"
          @click="activeTab = 'specs'"
        >
          📏 Standar Teknis
        </button>
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'components' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'components'"
          @click="activeTab = 'components'"
        >
          🔩 Komponen Terpasang
        </button>
        <button
          class="bike-tab"
          :class="{ 'bike-tab--active': activeTab === 'maintenance' }"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'maintenance'"
          @click="activeTab = 'maintenance'"
        >
          🔧 Riwayat Servis
        </button>
      </nav>

      <!-- TAB 1: TECHNICAL SPECS & STANDARDS -->
      <section v-if="activeTab === 'specs'" class="tab-section">
        <div class="spec-filters-bar">
          <div class="spec-filters-label">Kategori Komponen:</div>
          <div class="spec-category-chips">
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'all' }"
              type="button"
              @click="specGroupFilter = 'all'"
            >
              Semua ({{ BIKE_SPEC_DEFINITIONS.length }})
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'frame' }"
              type="button"
              @click="specGroupFilter = 'frame'"
            >
              Frame &amp; As Roda
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'wheels' }"
              type="button"
              @click="specGroupFilter = 'wheels'"
            >
              Roda &amp; Freehub
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'drivetrain' }"
              type="button"
              @click="specGroupFilter = 'drivetrain'"
            >
              Drivetrain &amp; BB
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'fork_headset' }"
              type="button"
              @click="specGroupFilter = 'fork_headset'"
            >
              Garpu &amp; Headset
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'brakes' }"
              type="button"
              @click="specGroupFilter = 'brakes'"
            >
              Rem &amp; Rotor
            </button>
            <button
              class="filter-pill"
              :class="{ 'filter-pill--active': specGroupFilter === 'cockpit_seating' }"
              type="button"
              @click="specGroupFilter = 'cockpit_seating'"
            >
              Seatpost &amp; Kokpit
            </button>
          </div>
        </div>

        <div class="specs-grid">
          <article
            v-for="def in filteredDefinitions"
            :key="def.code"
            class="spec-card-clean"
            :class="`spec-card-clean--${specStatus(def.code)}`"
          >
            <div class="spec-card-clean__header">
              <div class="spec-card-clean__topline">
                <span class="spec-status-dot" :class="`dot--${specStatus(def.code)}`" />
                <h3 class="spec-card-clean__title">{{ def.label }}</h3>
              </div>
              <span class="spec-tag" :class="`spec-tag--${specStatus(def.code)}`">
                {{ specStatus(def.code) === 'known' ? 'Tervalidasi' : specStatus(def.code) === 'unknown' ? 'Belum Tahu' : 'Belum Diisi' }}
              </span>
            </div>

            <p class="spec-card-clean__desc">{{ def.description }}</p>

            <div class="spec-card-clean__form">
              <select
                v-model="selections[def.code]"
                :aria-label="def.label"
                class="spec-select"
                @change="saveSpec(def.code)"
              >
                <option value="missing" disabled>Pilih standar…</option>
                <option value="unknown">Belum tahu standar ini</option>
                <option
                  v-for="opt in def.values"
                  :key="opt.code"
                  :value="opt.code"
                >
                  {{ opt.label }}
                </option>
              </select>
              <span v-if="savingCode === def.code" class="save-indicator">Menyimpan…</span>
            </div>
          </article>
        </div>
      </section>

      <!-- TAB 2: INSTALLED COMPONENTS -->
      <section v-else-if="activeTab === 'components'" class="tab-section">
        <InstalledComponents :bike-id="bike.id" />
      </section>

      <!-- TAB 3: MAINTENANCE NOTEBOOK -->
      <section v-else-if="activeTab === 'maintenance'" class="tab-section">
        <MaintenanceLog :bike-id="bike.id" />
      </section>
    </template>

    <!-- PHOTO MODAL (GARAGE-007) -->
    <div v-if="showPhotoModal" class="native-modal-backdrop" @click.self="showPhotoModal = false">
      <div class="native-modal-sheet">
        <div class="modal-header">
          <h2>Foto Sepeda</h2>
          <button class="modal-close" type="button" @click="showPhotoModal = false">✕</button>
        </div>

        <form class="clean-form" @submit.prevent="saveBikePhoto">
          <label>
            <span>Upload Foto dari Perangkat</span>
            <input type="file" accept="image/*" @change="handlePhotoFileUpload" />
          </label>

          <label>
            <span>Atau Masukkan URL Foto</span>
            <input
              v-model="photoInputUrl"
              type="url"
              placeholder="https://images.unsplash.com/... atau tautan gambar"
            />
          </label>

          <div v-if="photoInputUrl" class="photo-preview-box">
            <img :src="photoInputUrl" alt="Preview foto sepeda" class="modal-photo-preview" />
          </div>

          <button class="button button--primary button--full" :disabled="savingPhoto" type="submit">
            {{ savingPhoto ? 'Menyimpan…' : 'Simpan Foto' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bike-detail-page {
  display: grid;
  gap: 1.25rem;
}

.back-link {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-ink);
  text-decoration: none;
}

.bike-hero-rich {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.bike-hero-rich__top {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
}

.bike-hero-rich__visual {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1rem;
  background: var(--color-sand);
  overflow: hidden;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px solid var(--color-sand);
}

.bike-hero-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bike-hero-rich__icon {
  font-size: 2rem;
}

.photo-edit-badge {
  position: absolute;
  bottom: 0.2rem;
  right: 0.2rem;
  font-size: 0.75rem;
  background: rgb(255 255 255 / 85%);
  padding: 0.15rem 0.3rem;
  border-radius: 0.4rem;
  backdrop-filter: blur(4px);
}

.bike-hero-rich__info h1 {
  margin: 0.2rem 0;
  font-size: 1.35rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.bike-hero-rich__info p {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  font-weight: 700;
}

.bike-hero-rich__actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-items: flex-end;
}

.bike-notes-box {
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-sand);
  font-size: 0.78rem;
  color: var(--color-ink);
}

/* Tabs */
.bike-tabs-bar {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding: 0.2rem 0;
}

.bike-tab {
  padding: 0.55rem 0.95rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.8rem;
  font-weight: 850;
  cursor: pointer;
  white-space: nowrap;
  transition: all 120ms ease;
}

.bike-tab--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.tab-section {
  display: grid;
  gap: 1rem;
}

.spec-filters-bar {
  display: grid;
  gap: 0.45rem;
}

.spec-filters-label {
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.spec-category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.filter-pill {
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
  cursor: pointer;
}

.filter-pill--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

/* Specs Grid */
.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
  gap: 0.75rem;
}

.spec-card-clean {
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  border-radius: 0.95rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.spec-card-clean__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.spec-card-clean__topline {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.spec-status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.dot--known {
  background: #16a34a;
}

.dot--unknown {
  background: #0284c7;
}

.dot--missing {
  background: #d1d5db;
}

.spec-card-clean__title {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 850;
}

.spec-tag {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 850;
  padding: 0.1rem 0.4rem;
  border-radius: 0.35rem;
}

.spec-tag--known {
  background: rgb(201 243 106 / 40%);
  color: #166534;
}

.spec-tag--unknown {
  background: #e0f2fe;
  color: #0369a1;
}

.spec-tag--missing {
  background: var(--color-sand);
  color: var(--color-asphalt);
}

.spec-card-clean__desc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.spec-card-clean__form {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.2rem;
}

.spec-select {
  flex: 1;
  padding: 0.45rem 0.65rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.78rem;
  outline: none;
}

.save-indicator {
  font-size: 0.68rem;
  color: #16a34a;
  font-weight: 800;
}

/* Modals */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 60%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1rem;
}

.native-modal-sheet {
  width: 100%;
  max-width: 26rem;
  background: var(--color-white);
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 12px 40px rgb(0 0 0 / 25%);
  display: grid;
  gap: 1rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 850;
}

.modal-close {
  border: none;
  background: none;
  font-size: 1rem;
  color: var(--color-asphalt);
  cursor: pointer;
}

.clean-form {
  display: grid;
  gap: 0.65rem;
}

.clean-form label {
  display: grid;
  gap: 0.25rem;
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-asphalt);
}

.clean-form input {
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  font-size: 0.8rem;
}

.photo-preview-box {
  width: 100%;
  height: 10rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: var(--color-sand);
}

.modal-photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 48rem) {
  .bike-hero-rich__top {
    grid-template-columns: 1fr;
    justify-items: start;
  }
  .bike-hero-rich__actions {
    align-items: flex-start;
  }
}
</style>
