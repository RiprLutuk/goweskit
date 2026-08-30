<script setup lang="ts">
import type {
  Bike,
  BikeListResponse,
  CompatibilityEvaluationResponse,
  CompatibilityRule,
  CompatibilityRuleCode,
  CompatibilityRuleListResponse,
} from '@goweskit/contracts';
import { COMPATIBILITY_STATUS_PRESENTATION } from '@goweskit/ui';

const route = useRoute();
const api = useApi();
const { user, initialized, refresh, login } = useAuth();
const { toast } = useNotify();
const bikes = ref<Bike[]>([]);
const rules = ref<CompatibilityRule[]>([]);
const selectedBikeId = ref('');
const selectedRuleCode = ref<CompatibilityRuleCode>('wheel_size');
const candidateKnowledge = ref<'known' | 'unknown'>('known');
const candidateValue = ref('');
const result = ref<CompatibilityEvaluationResponse | null>(null);
const loading = ref(true);
const evaluating = ref(false);
const errorMessage = ref('');
const demoLoggingIn = ref(false);

const activeRule = computed(() =>
  rules.value.find((rule) => rule.code === selectedRuleCode.value),
);
const presentation = computed(() =>
  result.value === null
    ? null
    : COMPATIBILITY_STATUS_PRESENTATION[result.value.status],
);

watch(activeRule, (rule) => {
  candidateValue.value = rule?.values[0]?.code ?? '';
  result.value = null;
});
watch(candidateKnowledge, () => {
  result.value = null;
});
watch([selectedBikeId, candidateValue], () => {
  result.value = null;
});

onMounted(async () => {
  try {
    rules.value = (
      await api<CompatibilityRuleListResponse>('/compatibility/standards')
    ).rules;
    candidateValue.value = rules.value[0]?.values[0]?.code ?? '';
    if (!initialized.value) await refresh();
    if (user.value !== null) {
      bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
      const requestedBike = String(route.query.bike ?? '');
      selectedBikeId.value = bikes.value.some(
        (bike) => bike.id === requestedBike,
      )
        ? requestedBike
        : (bikes.value[0]?.id ?? '');
    }
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
});

async function quickDemoLogin(): Promise<void> {
  demoLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await login({
      email: 'demo@goweskit.local',
      password: 'GowesKitDemo123!',
    });
    bikes.value = (await api<BikeListResponse>('/bikes')).bikes;
    selectedBikeId.value = bikes.value[0]?.id ?? '';
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    demoLoggingIn.value = false;
  }
}

function applyPreset(rule: CompatibilityRuleCode, value: string, knowledge: 'known' | 'unknown' = 'known'): void {
  selectedRuleCode.value = rule;
  candidateKnowledge.value = knowledge;
  candidateValue.value = value;
  result.value = null;
  void evaluate();
}

async function evaluate(): Promise<void> {
  if (selectedBikeId.value === '' || activeRule.value === undefined) return;
  evaluating.value = true;
  errorMessage.value = '';
  result.value = null;
  try {
    result.value = await api<CompatibilityEvaluationResponse>(
      '/compatibility/evaluate',
      {
        method: 'POST',
        body: {
          bikeId: selectedBikeId.value,
          candidates: [
            candidateKnowledge.value === 'unknown'
              ? {
                  ruleCode: selectedRuleCode.value,
                  knowledge: 'unknown',
                }
              : {
                  ruleCode: selectedRuleCode.value,
                  knowledge: 'known',
                  value: candidateValue.value,
                },
          ],
        },
      },
    );
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    evaluating.value = false;
  }
}

async function shareUpgradeResult(): Promise<void> {
  if (!result.value) return;
  const currentBike = bikes.value.find((b) => b.id === selectedBikeId.value);
  const bikeName = currentBike ? currentBike.nickname : 'Sepeda';
  const statusLabel = presentation.value ? presentation.value.label : result.value.status;

  const text = `⚡ HASIL UJI KOMPATIBILITAS GOWESKIT
━━━━━━━━━━━━━━━━━━━━
🚴 Sepeda: ${bikeName}
🔬 Uji Komponen: ${activeRule.value?.label ?? 'Komponen'}
📊 Status: ${presentation.value?.symbol ?? '✓'} ${statusLabel.toUpperCase()}
📝 Keterangan: ${result.value.humanExplanation}

🔗 Uji kompatibilitas part sepeda Anda di GowesKit:
${window.location.origin}/upgrade-lab

#GowesKit #UpgradeLab #BikeSpecs #KompatibilitasSepeda`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Hasil Uji Kompatibilitas ${bikeName} - GowesKit`,
        text,
        url: window.location.href,
      });
      toast.success('Hasil Uji Dibagikan!', 'Siap diposting ke media sosial.');
      return;
    } catch {
      // ignore abort
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success('Hasil Uji Disalin!', 'Siap ditempel ke WhatsApp atau forum sepeda.');
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}
</script>

<template>
  <div class="native-container upgrade-container">
    <!-- Header -->
    <header class="native-page-header">
      <div class="header-topline">
        <span class="native-eyebrow">Laboratorium Kompatibilitas</span>
        <span class="rule-ver-chip">Engine v1.0 Deterministic</span>
      </div>
      <h1 class="native-title">Upgrade Lab</h1>
      <p class="native-sub">
        Uji kecocokan komponen baru pada sepeda Anda berdasarkan standar dimensi teknis nyata, bukan tebak-tebakan merek.
      </p>
    </header>

    <!-- Skeleton Lab Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem;">
      <div class="skeleton-shimmer" style="width: 100%; height: 3.5rem; border-radius: 0.85rem;" />
      <div class="skeleton-shimmer" style="width: 100%; height: 8rem; border-radius: 1.15rem;" />
      <div class="skeleton-shimmer" style="width: 100%; height: 14rem; border-radius: 1.15rem;" />
    </div>

    <!-- Signed-out state -->
    <div v-else-if="!user" class="native-guest-box">
      <div class="guest-icon">
        <GIcon name="upgrade" size="xl" color="#17202A" filled />
      </div>
      <h2>Uji Kompatibilitas Komponen</h2>
      <p>Masuk ke akun GowesKit Anda untuk memilih sepeda dari garasi dan menguji suku cadang baru.</p>
      <div class="guest-actions">
        <NuxtLink class="button button--primary button--full" to="/login">Masuk ke Akun</NuxtLink>
        <NuxtLink class="button button--secondary button--full" to="/register">Daftar Akun Baru</NuxtLink>
        <button
          class="button button--sand button--full"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          <GIcon name="bolt" size="xs" color="#D97706" filled />
          <span>{{ demoLoggingIn ? 'Memuat Demo…' : 'Buka Contoh Lab Demo (1-Klik)' }}</span>
        </button>
      </div>
    </div>

    <div v-else-if="bikes.length === 0" class="native-empty-box">
      <div class="empty-icon">
        <GIcon name="bike" size="xl" color="#17202A" />
      </div>
      <h2>Daftarkan Sepeda Terlebih Dahulu</h2>
      <p>Anda memerlukan minimal 1 sepeda terdaftar di garasi untuk menguji suku cadang.</p>
      <NuxtLink class="button button--primary" to="/garage/new">
        <GIcon name="plus" size="xs" />
        <span>Tambah Sepeda ke Garasi</span>
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Quick Test Scenario Presets -->
      <section class="preset-section">
        <span class="preset-label">
          <GIcon name="bolt" size="xs" color="#D97706" filled />
          <span>Skenario Cepat Uji Suku Cadang</span>
        </span>
        <div class="preset-scroll-bar">
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('rear_axle', '12x148')"
          >
            <GIcon name="hub" size="xs" />
            <span>As Roda: 12×148 Boost</span>
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('freehub_cassette', 'micro_spline')"
          >
            <GIcon name="cassette" size="xs" />
            <span>Freehub: Micro Spline 12s</span>
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('freehub_cassette', 'xdr')"
          >
            <GIcon name="upgrade" size="xs" filled />
            <span>Freehub: SRAM XDR</span>
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('fork_steerer', 'tapered_1_1_8_to_1_1_2')"
          >
            <GIcon name="fork" size="xs" />
            <span>Fork: Tapered 1⅛–1½"</span>
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('wheel_size', 'iso_622')"
          >
            <GIcon name="wheel" size="xs" />
            <span>Roda: ISO 622 (29" / 700c)</span>
          </button>
        </div>
      </section>

      <!-- Evaluation Workbench Card -->
      <form class="native-form-card" @submit.prevent="evaluate">
        <div class="form-field-group">
          <label>
            <span class="field-label">Pilih Sepeda di Garasi Saya</span>
            <select v-model="selectedBikeId" required class="native-select">
              <option v-for="bike in bikes" :key="bike.id" :value="bike.id">
                {{ bike.nickname }} · {{ bike.bicycleType.name }}
              </option>
            </select>
          </label>

          <label>
            <span class="field-label">Standar Komponen yang Diuji</span>
            <select v-model="selectedRuleCode" required class="native-select">
              <option v-for="rule in rules" :key="rule.code" :value="rule.code">
                {{ rule.label }}
              </option>
            </select>
          </label>

          <!-- Candidate Specification Detail -->
          <div class="candidate-spec-card">
            <span class="spec-card-title">
              <GIcon name="cassette" size="xs" />
              <span>Spesifikasi Suku Cadang Baru (Kandidat)</span>
            </span>
            <div class="knowledge-segmented">
              <button
                class="seg-btn"
                :class="{ 'seg-btn--active': candidateKnowledge === 'known' }"
                type="button"
                @click="candidateKnowledge = 'known'"
              >
                Saya Tahu Standarnya
              </button>
              <button
                class="seg-btn"
                :class="{ 'seg-btn--active': candidateKnowledge === 'unknown' }"
                type="button"
                @click="candidateKnowledge = 'unknown'"
              >
                Belum Tahu / Tidak Ada Label
              </button>
            </div>

            <div v-if="candidateKnowledge === 'known' && activeRule" class="candidate-val-picker">
              <label>
                <span class="field-label">Nilai / Ukuran Standar Kandidat</span>
                <select v-model="candidateValue" class="native-select">
                  <option v-for="val in activeRule.values" :key="val.code" :value="val.code">
                    {{ val.label }}
                  </option>
                </select>
              </label>
            </div>

            <div v-else class="unknown-guidance-pill">
              <GIcon name="shield" size="xs" color="#0284C7" filled />
              <span>GowesKit akan memandu Anda mencari info yang hilang tanpa membuat asumsi salah.</span>
            </div>
          </div>

          <button
            class="button button--primary button--full"
            type="submit"
            :disabled="evaluating"
          >
            <GIcon name="upgrade" size="xs" />
            <span>{{ evaluating ? 'Menganalisis Standar…' : 'Evaluasi Kecocokan Sekarang' }}</span>
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">{{ errorMessage }}</p>

      <!-- Evaluation Result Card -->
      <section
        v-if="result && presentation"
        class="native-result-card"
        :class="`result-card--${result.status}`"
      >
        <div class="result-top-banner">
          <span class="result-status-badge">{{ presentation.symbol }} {{ presentation.label }}</span>
          <span v-if="result.ruleProvenance[0]" class="rule-ver-tag">
            Aturan v{{ result.ruleProvenance[0].ruleVersion }}
          </span>
        </div>

        <h2 class="result-headline">{{ result.humanExplanation }}</h2>
        <p class="result-summary">{{ result.technicalExplanation }}</p>

        <!-- Checks Performed Details -->
        <div v-for="chk in result.checksPerformed" :key="chk.ruleCode" class="tech-compare-table">
          <div class="compare-row">
            <span class="compare-lbl">Spek Sepeda ({{ chk.label }})</span>
            <strong class="compare-val">{{ chk.bikeValue || 'Belum Terdata (Unknown)' }}</strong>
          </div>
          <div class="compare-row">
            <span class="compare-lbl">Spek Suku Cadang Baru</span>
            <strong class="compare-val">{{ chk.candidateValue || 'Tidak Diketahui (Unknown)' }}</strong>
          </div>
        </div>

        <!-- Missing Info Guidance -->
        <div v-if="result.missingInformation && result.missingInformation.length" class="missing-info-box">
          <span class="missing-title">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            <span>Data yang Perlu Anda Pastikan:</span>
          </span>
          <ul>
            <li v-for="info in result.missingInformation" :key="info">{{ info }}</li>
          </ul>
        </div>

        <!-- Official Standard Provenance Reference -->
        <div v-if="result.ruleProvenance && result.ruleProvenance.length" class="provenance-source-box">
          <div class="provenance-header">
            <GIcon name="shield" size="xs" color="#0284C7" filled />
            <span class="provenance-label">Dasar Standar Resmi (Verified Provenance)</span>
          </div>
          <div class="provenance-list">
            <div v-for="prov in result.ruleProvenance" :key="prov.ruleCode" class="provenance-item">
              <a :href="prov.sourceUrl" target="_blank" rel="noopener noreferrer" class="provenance-link">
                <span>{{ prov.sourceTitle }}</span>
                <span class="ext-icon">↗</span>
              </a>
              <span class="provenance-meta">Aturan v{{ prov.ruleVersion }} · Ditinjau {{ prov.reviewedAt }}</span>
            </div>
          </div>
        </div>

        <!-- Share & Flex Action Bar -->
        <div class="result-share-bar">
          <button
            type="button"
            class="result-share-btn"
            @click="shareUpgradeResult"
          >
            <GIcon name="share" size="xs" />
            <span>Bagikan Hasil Uji Lab</span>
            <span>→</span>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.upgrade-container {
  display: grid;
  gap: 1.25rem;
  padding-bottom: 2.5rem;
}

.native-page-header {
  display: grid;
  gap: 0.35rem;
}

.header-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.native-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.05em;
}

.rule-ver-chip {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-sand);
  color: var(--color-ink);
}

.native-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.native-sub {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Preset Chips */
.preset-section {
  display: grid;
  gap: 0.45rem;
}

.preset-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.preset-scroll-bar {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  -webkit-overflow-scrolling: touch;
}

.preset-chip {
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--color-ink);
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 1px 4px rgb(23 32 42 / 4%);
}

.preset-chip:active {
  background: var(--color-chain-lime);
}

/* Form Card */
.native-form-card {
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 4px 18px rgb(23 32 42 / 5%);
}

.form-field-group {
  display: grid;
  gap: 0.85rem;
}

.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-asphalt);
  margin-bottom: 0.25rem;
}

.native-select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  font-size: 0.84rem;
  font-weight: 750;
  color: var(--color-ink);
  outline: none;
}

/* Candidate Spec Card */
.candidate-spec-card {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem;
  border-radius: 0.95rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.spec-card-title {
  font-size: 0.78rem;
  font-weight: 850;
  color: var(--color-ink);
}

.knowledge-segmented {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 0.65rem;
  background: var(--color-sand);
}

.seg-btn {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--color-asphalt);
  cursor: pointer;
  transition: all 120ms ease;
}

.seg-btn--active {
  background: var(--color-white);
  color: var(--color-ink);
  box-shadow: 0 1px 4px rgb(23 32 42 / 8%);
}

.unknown-guidance-pill {
  font-size: 0.74rem;
  color: var(--color-asphalt);
  padding: 0.5rem 0.65rem;
  border-radius: 0.5rem;
  background: var(--color-white);
  border: 1px dashed var(--color-sand);
}

/* Result Card */
.native-result-card {
  display: grid;
  gap: 0.85rem;
  padding: 1.25rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 2px solid var(--color-sand);
  box-shadow: 0 6px 24px rgb(23 32 42 / 8%);
}

.result-card--compatible {
  border-color: #22c55e;
}

.result-card--incompatible {
  border-color: #ef4444;
}

.result-card--unknown {
  border-color: #f59e0b;
}

.result-top-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-status-badge {
  font-size: 0.76rem;
  font-weight: 900;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-sand);
}

.result-card--compatible .result-status-badge {
  background: rgb(201 243 106 / 60%);
  color: #166534;
}

.result-card--incompatible .result-status-badge {
  background: #fee2e2;
  color: #dc2626;
}

.result-card--unknown .result-status-badge {
  background: #fef3c7;
  color: #b45309;
}

.rule-ver-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-asphalt);
}

.result-headline {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.result-summary {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.tech-compare-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.compare-row {
  display: grid;
  gap: 0.15rem;
}

.compare-lbl {
  font-size: 0.68rem;
  color: var(--color-asphalt);
  font-weight: 750;
}

.compare-val {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--color-ink);
}

.why-matters-box,
.next-step-box,
.missing-info-box {
  font-size: 0.76rem;
  line-height: 1.4;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
}

.missing-info-box {
  background: #fffbeb;
  color: #b45309;
}

.missing-info-box ul {
  margin: 0.25rem 0 0;
  padding-left: 1.15rem;
}

/* Provenance Reference Box */
.provenance-source-box {
  display: grid;
  gap: 0.4rem;
  padding: 0.75rem 0.95rem;
  border-radius: 0.85rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
}

.provenance-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-asphalt);
}

.provenance-list {
  display: grid;
  gap: 0.35rem;
}

.provenance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.provenance-link {
  font-size: 0.76rem;
  font-weight: 800;
  color: #0284c7;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.provenance-link:hover {
  text-decoration: underline;
}

.ext-icon {
  font-size: 0.7rem;
}

.provenance-meta {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--color-asphalt);
}

.result-share-bar {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.result-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.15rem;
  border-radius: 0.75rem;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0.8rem;
  font-weight: 850;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 2px 0 var(--color-ink);
  cursor: pointer;
  transition: transform 90ms ease;
}

.result-share-btn:active {
  transform: translateY(2px);
  box-shadow: 0 0 0 var(--color-ink);
}

/* Guest & Empty */
.native-guest-box,
.native-empty-box {
  display: grid;
  gap: 1rem;
  text-align: center;
  padding: 2.25rem 1.5rem;
  border-radius: 1.35rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
}

.guest-icon,
.empty-icon {
  font-size: 3.2rem;
}

.native-guest-box h2,
.native-empty-box h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 850;
}

.native-guest-box p,
.native-empty-box p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

.guest-actions {
  display: grid;
  gap: 0.65rem;
}
</style>
