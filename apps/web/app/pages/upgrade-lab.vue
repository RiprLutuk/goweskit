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

const REQUIRED_TOOLS: Record<
  string,
  Array<{ name: string; icon: string; desc: string }>
> = {
  bottom_bracket: [
    {
      name: 'Kunci BB Hollowtech / T47',
      icon: '🔧',
      desc: 'Sesuai tipe mangkok BB frame',
    },
    {
      name: 'Grease Anti-Seize',
      icon: '🧴',
      desc: 'Mencegah creaking pada drat',
    },
    {
      name: 'Kunci Torsi (35-50 Nm)',
      icon: '⚙️',
      desc: 'Memastikan kekencangan standar pabrik',
    },
  ],
  brake_mount: [
    { name: 'Kunci Torx T25', icon: '🔧', desc: 'Baut rotor cakram 6-bolt' },
    {
      name: 'Kunci Hex 4/5mm',
      icon: '⚙️',
      desc: 'Baut kaliper Post / Flat Mount',
    },
    {
      name: 'Rotor Alignment Tool',
      icon: '📏',
      desc: 'Menghindari gesekan pad rem',
    },
  ],
  rear_axle: [
    { name: 'Kunci Hex 5/6mm', icon: '🔧', desc: 'Thru-Axle leverless' },
    { name: 'Thru-Axle Thread Lube', icon: '🧴', desc: 'Pelumas ulir as roda' },
  ],
  front_axle: [
    { name: 'Kunci Hex 5/6mm', icon: '🔧', desc: 'Thru-Axle leverless' },
    { name: 'Thru-Axle Thread Lube', icon: '🧴', desc: 'Pelumas ulir as roda' },
  ],
  seatpost_diameter: [
    {
      name: 'Torque Wrench (4-5 Nm)',
      icon: '⚙️',
      desc: 'Wajib untuk seatpost/frame karbon',
    },
    {
      name: 'Carbon Grip Paste',
      icon: '🧴',
      desc: 'Mencegah seatpost merosot tanpa over-torque',
    },
  ],
  headset: [
    {
      name: 'Kunci Hex 4/5mm',
      icon: '🔧',
      desc: 'Top cap preload & stem clamp',
    },
    {
      name: 'Headset Bearing Grease',
      icon: '🧴',
      desc: 'Melindungi bearing dari keringat/air',
    },
  ],
  cassette_freehub: [
    { name: 'Chain Whip', icon: '⛓️', desc: 'Menahan sproket saat dibuka' },
    {
      name: 'Cassette Lockring Tool',
      icon: '🔧',
      desc: 'Sesuai standar Shimano/SRAM',
    },
    {
      name: 'Kunci Pas 24mm / Kunci Torsi',
      icon: '⚙️',
      desc: 'Torsi pengencangan 40 Nm',
    },
  ],
  wheel_size: [
    {
      name: 'Tire Lever (Pencungkil Ban)',
      icon: '🪛',
      desc: 'Pemasangan ban luar',
    },
    {
      name: 'Pompa Lantai dengan Gauge',
      icon: '💨',
      desc: 'Menyesuaikan tekanan PSI standar',
    },
  ],
};

function getRequiredTools(ruleCode: string) {
  return (
    REQUIRED_TOOLS[ruleCode] || [
      {
        name: 'Set Kunci Hex (4, 5, 6mm)',
        icon: '🔧',
        desc: 'Kunci standar perakitan sepeda',
      },
      { name: 'Kunci Torsi', icon: '⚙️', desc: 'Menjaga keamanan torsi baut' },
    ]
  );
}

interface ShoppingItem {
  id: string;
  name: string;
  category: 'part' | 'consumable' | 'labor';
  checked: boolean;
  estPrice: string;
}

const BUDGET_TIERS: Record<
  string,
  { economic: string; enthusiast: string; pro: string; labor: string }
> = {
  bottom_bracket: {
    economic: 'Rp 180.000 - 350.000',
    enthusiast: 'Rp 650.000 - 1.200.000',
    pro: 'Rp 1.800.000 - 3.500.000',
    labor: 'Rp 50.000 - 80.000',
  },
  wheel_size: {
    economic: 'Rp 800.000 - 1.800.000',
    enthusiast: 'Rp 2.800.000 - 6.500.000',
    pro: 'Rp 12.000.000 - 28.000.000',
    labor: 'Rp 75.000 - 150.000',
  },
  brake_mount: {
    economic: 'Rp 350.000 - 750.000',
    enthusiast: 'Rp 1.500.000 - 3.200.000',
    pro: 'Rp 4.500.000 - 9.000.000',
    labor: 'Rp 60.000 - 120.000',
  },
  rear_axle: {
    economic: 'Rp 120.000 - 250.000',
    enthusiast: 'Rp 350.000 - 700.000',
    pro: 'Rp 900.000 - 1.800.000',
    labor: 'Rp 30.000 - 50.000',
  },
  front_axle: {
    economic: 'Rp 120.000 - 250.000',
    enthusiast: 'Rp 350.000 - 700.000',
    pro: 'Rp 900.000 - 1.800.000',
    labor: 'Rp 30.000 - 50.000',
  },
  seatpost_diameter: {
    economic: 'Rp 150.000 - 350.000',
    enthusiast: 'Rp 650.000 - 1.800.000',
    pro: 'Rp 2.500.000 - 6.000.000',
    labor: 'Rp 40.000 - 80.000',
  },
  headset: {
    economic: 'Rp 150.000 - 300.000',
    enthusiast: 'Rp 450.000 - 900.000',
    pro: 'Rp 1.500.000 - 2.800.000',
    labor: 'Rp 50.000 - 100.000',
  },
  cassette_freehub: {
    economic: 'Rp 250.000 - 600.000',
    enthusiast: 'Rp 900.000 - 2.200.000',
    pro: 'Rp 3.500.000 - 8.500.000',
    labor: 'Rp 50.000 - 80.000',
  },
};

const selectedBudgetTier = ref<'economic' | 'enthusiast' | 'pro'>('enthusiast');
const shoppingItems = ref<ShoppingItem[]>([]);

function generateShoppingList() {
  const code = selectedRuleCode.value;
  const val = candidateValue.value;
  const tiers = BUDGET_TIERS[code] || BUDGET_TIERS.bottom_bracket!;
  const tierPrice =
    selectedBudgetTier.value === 'economic'
      ? tiers.economic
      : selectedBudgetTier.value === 'pro'
        ? tiers.pro
        : tiers.enthusiast;

  shoppingItems.value = [
    {
      id: '1',
      name: `Unit Part: ${activeRule.value?.label || 'Komponen'} (${val || 'Standar Baru'})`,
      category: 'part',
      checked: false,
      estPrice: tierPrice,
    },
    {
      id: '2',
      name: 'Spacer / Adaptor / Ring Penyesuai Presisi',
      category: 'part',
      checked: false,
      estPrice: 'Rp 35.000 - 90.000',
    },
    {
      id: '3',
      name: 'Grease / Pelumas Khusus Anti-Seize / Threadlocker',
      category: 'consumable',
      checked: false,
      estPrice: 'Rp 45.000 - 85.000',
    },
    {
      id: '4',
      name: 'Estimasi Jasa Pasang Bengkel & Uji Jalan',
      category: 'labor',
      checked: false,
      estPrice: tiers.labor,
    },
  ];
}

watch(
  [selectedRuleCode, candidateValue, selectedBudgetTier],
  () => {
    generateShoppingList();
  },
  { immediate: true },
);

function toggleShoppingItem(item: ShoppingItem) {
  item.checked = !item.checked;
}

async function copyShoppingList() {
  const currentBike = bikes.value.find((b) => b.id === selectedBikeId.value);
  const text = `🛒 DAFTAR BELANJA UPGRADE SEPEDA — GOWESKIT
🚲 Sepeda: ${currentBike ? currentBike.nickname : 'Sepeda Saya'}
🎯 Uji Part: ${activeRule.value?.label || selectedRuleCode.value} (${candidateValue.value})
💰 Tier Budget: ${selectedBudgetTier.value.toUpperCase()}

Checklist Belanja:
${shoppingItems.value.map((i) => `${i.checked ? '✅' : '⬜'} ${i.name} [${i.estPrice}]`).join('\n')}

💡 Rekomendasi: Pastikan ukuran standar sesuai sebelum transaksi di toko/bengkel.`;

  try {
    await navigator.clipboard.writeText(text);
    toast.success(
      'Daftar Belanja Disalin!',
      'Siap dikirim ke WhatsApp toko sepeda atau catatan belanja Anda.',
    );
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

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

function applyPreset(
  rule: CompatibilityRuleCode,
  value: string,
  knowledge: 'known' | 'unknown' = 'known',
): void {
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
  const statusLabel = presentation.value
    ? presentation.value.label
    : result.value.status;

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
    toast.success(
      'Hasil Uji Disalin!',
      'Siap ditempel ke WhatsApp atau forum sepeda.',
    );
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
        Uji kecocokan komponen baru pada sepeda Anda berdasarkan standar dimensi
        teknis nyata, bukan tebak-tebakan merek.
      </p>
    </header>

    <!-- Skeleton Lab Shimmer during Loading -->
    <div v-if="loading" style="display: grid; gap: 1rem">
      <div
        class="skeleton-shimmer"
        style="width: 100%; height: 3.5rem; border-radius: 0.85rem"
      />
      <div
        class="skeleton-shimmer"
        style="width: 100%; height: 8rem; border-radius: 1.15rem"
      />
      <div
        class="skeleton-shimmer"
        style="width: 100%; height: 14rem; border-radius: 1.15rem"
      />
    </div>

    <!-- Signed-out state -->
    <div v-else-if="!user" class="native-guest-box">
      <div class="guest-icon">
        <GIcon name="upgrade" size="xl" color="#17202A" filled />
      </div>
      <h2>Uji Kompatibilitas Komponen</h2>
      <p>
        Masuk ke akun GowesKit Anda untuk memilih sepeda dari garasi dan menguji
        suku cadang baru.
      </p>
      <div class="guest-actions">
        <NuxtLink class="button button--primary button--full" to="/login"
          >Masuk ke Akun</NuxtLink
        >
        <NuxtLink class="button button--secondary button--full" to="/register"
          >Daftar Akun Baru</NuxtLink
        >
        <button
          class="button button--sand button--full"
          type="button"
          :disabled="demoLoggingIn"
          @click="quickDemoLogin"
        >
          <GIcon name="bolt" size="xs" color="#D97706" filled />
          <span>{{
            demoLoggingIn ? 'Memuat Demo…' : 'Buka Contoh Lab Demo (1-Klik)'
          }}</span>
        </button>
      </div>
    </div>

    <div v-else-if="bikes.length === 0" class="native-empty-box">
      <div class="empty-icon">
        <GIcon name="bike" size="xl" color="#17202A" />
      </div>
      <h2>Daftarkan Sepeda Terlebih Dahulu</h2>
      <p>
        Anda memerlukan minimal 1 sepeda terdaftar di garasi untuk menguji suku
        cadang.
      </p>
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

            <div
              v-if="candidateKnowledge === 'known' && activeRule"
              class="candidate-val-picker"
            >
              <label>
                <span class="field-label">Nilai / Ukuran Standar Kandidat</span>
                <select v-model="candidateValue" class="native-select">
                  <option
                    v-for="val in activeRule.values"
                    :key="val.code"
                    :value="val.code"
                  >
                    {{ val.label }}
                  </option>
                </select>
              </label>
            </div>

            <div v-else class="unknown-guidance-pill">
              <GIcon name="shield" size="xs" color="#0284C7" filled />
              <span
                >GowesKit akan memandu Anda mencari info yang hilang tanpa
                membuat asumsi salah.</span
              >
            </div>
          </div>

          <button
            class="button button--primary button--full"
            type="submit"
            :disabled="evaluating"
          >
            <GIcon name="upgrade" size="xs" />
            <span>{{
              evaluating
                ? 'Menganalisis Standar…'
                : 'Evaluasi Kecocokan Sekarang'
            }}</span>
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>

      <!-- Evaluation Result Card -->
      <section
        v-if="result && presentation"
        class="native-result-card"
        :class="`result-card--${result.status}`"
      >
        <div class="result-top-banner">
          <span class="result-status-badge"
            >{{ presentation.symbol }} {{ presentation.label }}</span
          >
          <span v-if="result.ruleProvenance[0]" class="rule-ver-tag">
            Aturan v{{ result.ruleProvenance[0].ruleVersion }}
          </span>
        </div>

        <h2 class="result-headline">{{ result.humanExplanation }}</h2>
        <p class="result-summary">{{ result.technicalExplanation }}</p>

        <!-- Checks Performed Details -->
        <div
          v-for="chk in result.checksPerformed"
          :key="chk.ruleCode"
          class="tech-compare-table"
        >
          <div class="compare-row">
            <span class="compare-lbl">Spek Sepeda ({{ chk.label }})</span>
            <strong class="compare-val">{{
              chk.bikeValue || 'Belum Terdata (Unknown)'
            }}</strong>
          </div>
          <div class="compare-row">
            <span class="compare-lbl">Spek Suku Cadang Baru</span>
            <strong class="compare-val">{{
              chk.candidateValue || 'Tidak Diketahui (Unknown)'
            }}</strong>
          </div>
        </div>

        <!-- Missing Info Guidance -->
        <div
          v-if="result.missingInformation && result.missingInformation.length"
          class="missing-info-box"
        >
          <span class="missing-title">
            <GIcon name="shield" size="xs" color="#EF4444" filled />
            <span>Data yang Perlu Anda Pastikan:</span>
          </span>
          <ul>
            <li v-for="info in result.missingInformation" :key="info">
              {{ info }}
            </li>
          </ul>
        </div>

        <!-- Official Standard Provenance Reference -->
        <div
          v-if="result.ruleProvenance && result.ruleProvenance.length"
          class="provenance-source-box"
        >
          <div class="provenance-header">
            <GIcon name="shield" size="xs" color="#0284C7" filled />
            <span class="provenance-label"
              >Dasar Standar Resmi (Verified Provenance)</span
            >
          </div>
          <div class="provenance-list">
            <div
              v-for="prov in result.ruleProvenance"
              :key="prov.ruleCode"
              class="provenance-item"
            >
              <a
                :href="prov.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="provenance-link"
              >
                <span>{{ prov.sourceTitle }}</span>
                <span class="ext-icon">↗</span>
              </a>
              <span class="provenance-meta"
                >Aturan v{{ prov.ruleVersion }} · Ditinjau
                {{ prov.reviewedAt }}</span
              >
            </div>
          </div>
        </div>

        <!-- Required Mechanic Tools Box -->
        <div class="tools-guide-box">
          <div class="tools-header">
            <span class="tools-title"
              >🛠️ Perkakas Mekanik yang Dibutuhkan:</span
            >
          </div>
          <div class="tools-grid">
            <div
              v-for="tool in getRequiredTools(selectedRuleCode)"
              :key="tool.name"
              class="tool-item"
            >
              <span class="tool-icon">{{ tool.icon }}</span>
              <div class="tool-info">
                <strong>{{ tool.name }}</strong>
                <small>{{ tool.desc }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget & Part Shopping Checklist (GOAL-004) -->
        <div class="shopping-checklist-box">
          <div class="shopping-head">
            <div class="head-left">
              <span class="shopping-title"
                >🚲 Estimasi Biaya &amp; Checklist Belanja Part:</span
              >
              <small class="shopping-subtitle"
                >Siapkan part &amp; perkakas sebelum eksekusi di toko atau
                bengkel.</small
              >
            </div>
            <!-- Tier selector -->
            <div class="tier-pills">
              <button
                type="button"
                class="tier-pill"
                :class="{ active: selectedBudgetTier === 'economic' }"
                @click="selectedBudgetTier = 'economic'"
              >
                Ekonomis
              </button>
              <button
                type="button"
                class="tier-pill"
                :class="{ active: selectedBudgetTier === 'enthusiast' }"
                @click="selectedBudgetTier = 'enthusiast'"
              >
                Enthusiast
              </button>
              <button
                type="button"
                class="tier-pill"
                :class="{ active: selectedBudgetTier === 'pro' }"
                @click="selectedBudgetTier = 'pro'"
              >
                Pro Spec
              </button>
            </div>
          </div>

          <!-- Interactive checklist items -->
          <div class="checklist-items">
            <div
              v-for="item in shoppingItems"
              :key="item.id"
              class="check-row"
              :class="{ checked: item.checked }"
              @click="toggleShoppingItem(item)"
            >
              <input
                type="checkbox"
                :checked="item.checked"
                class="check-input"
                @click.stop="toggleShoppingItem(item)"
              />
              <div class="check-info">
                <span class="check-name">{{ item.name }}</span>
                <span class="check-price">{{ item.estPrice }}</span>
              </div>
            </div>
          </div>

          <div class="shopping-footer">
            <button
              type="button"
              class="btn-copy-shopping"
              @click="copyShoppingList"
            >
              <GIcon name="bookmark" size="xs" />
              <span>Salin Checklist ke WhatsApp / Catatan</span>
            </button>
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

.tools-guide-box {
  display: grid;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.tools-header {
  font-size: 0.75rem;
  font-weight: 850;
  color: #1e293b;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.5rem;
}

.tool-item {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.45rem 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
}

.tool-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.tool-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.tool-info strong {
  font-size: 0.76rem;
  color: #1e293b;
}

.tool-info small {
  font-size: 0.68rem;
  color: #64748b;
  line-height: 1.2;
}

.shopping-checklist-box {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border-radius: 1rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
}

.shopping-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.head-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.shopping-title {
  font-size: 0.85rem;
  font-weight: 850;
  color: #0f172a;
}

.shopping-subtitle {
  font-size: 0.72rem;
  color: #64748b;
}

.tier-pills {
  display: flex;
  gap: 0.35rem;
}

.tier-pill {
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 800;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
}

.tier-pill.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.65rem;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  transition: all 120ms ease;
}

.check-row:hover {
  border-color: #94a3b8;
}

.check-row.checked {
  background: #f0fdf4;
  border-color: #86efac;
}

.check-row.checked .check-name {
  text-decoration: line-through;
  color: #64748b;
}

.check-input {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
  accent-color: #16a34a;
}

.check-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 0.5rem;
}

.check-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

.check-price {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 800;
  color: #0f766e;
  white-space: nowrap;
}

.shopping-footer {
  display: flex;
  justify-content: flex-end;
}

.btn-copy-shopping {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
  border-radius: 0.6rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
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
