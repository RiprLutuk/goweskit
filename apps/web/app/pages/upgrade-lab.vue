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
</script>

<template>
  <div class="page-stack upgrade-page">
    <header class="page-heading">
      <span class="status-chip status-chip--lime">Upgrade Lab v1</span>
      <h1>Check standards before buying a part.</h1>
      <p>
        GowesKit compares normalized technical values with 100% deterministic rules.
        It never uses brand as compatibility truth, and will explicitly say when information is missing.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">
      Preparing the workbench…
    </p>

    <!-- Signed out state -->
    <div v-else-if="!user" class="state-card guest-upgrade-box">
      <div class="guest-upgrade-content">
        <span class="guest-upgrade-icon">⚡</span>
        <div>
          <h2>Check Upgrades on Your Bike</h2>
          <p>
            Sign in to select any bicycle from your personal Garage and verify candidate component standards.
          </p>
        </div>
      </div>
      <div class="action-row">
        <NuxtLink class="button button--primary" to="/login">Sign In</NuxtLink>
        <NuxtLink class="button button--secondary" to="/register">Create Account</NuxtLink>
      </div>
    </div>

    <div v-else-if="bikes.length === 0" class="state-card signed-out-state">
      <strong>Add a bike before checking an upgrade.</strong>
      <p>Only a nickname and bicycle type are required to begin.</p>
      <NuxtLink class="button button--primary" to="/garage/new">
        Add a bike
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Quick Candidate Upgrade Presets -->
      <section class="upgrade-presets-section" aria-labelledby="presets-title">
        <p class="technical-label">Quick Test Scenarios</p>
        <h2 id="presets-title" class="visually-hidden">Candidate Part Presets</h2>
        <div class="preset-chips-bar">
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('rear_axle', '12x148')"
          >
            🏁 Rear Axle: 12×148 Boost
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('freehub_cassette', 'micro_spline')"
          >
            ⛓️ Freehub: Micro Spline 12s
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('freehub_cassette', 'xdr')"
          >
            ⚡ Freehub: SRAM XDR
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('fork_steerer', 'tapered_1_1_8_to_1_1_2')"
          >
            🍴 Fork: Tapered 1⅛ to 1½
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('wheel_size', 'iso_622')"
          >
            ⭕ Wheel: ISO 622 (29" / 700c)
          </button>
          <button
            class="preset-chip"
            type="button"
            @click="applyPreset('freehub_cassette', '', 'unknown')"
          >
            ❓ Freehub: Unknown Candidate
          </button>
        </div>
      </section>

      <form
        class="form-card form-card--wide upgrade-form"
        @submit.prevent="evaluate"
      >
        <div class="form-stack">
          <label for="upgrade-bike">
            <span>Choose Bike from Your Garage</span>
            <select id="upgrade-bike" v-model="selectedBikeId" required>
              <option v-for="bike in bikes" :key="bike.id" :value="bike.id">
                {{ bike.nickname }} · {{ bike.bicycleType.name }}
              </option>
            </select>
          </label>

          <label for="upgrade-rule">
            <span>Standard to evaluate</span>
            <select id="upgrade-rule" v-model="selectedRuleCode" required>
              <option v-for="rule in rules" :key="rule.code" :value="rule.code">
                {{ rule.label }}
              </option>
            </select>
          </label>

          <fieldset class="spec-fieldset">
            <legend>Candidate Component Details</legend>
            <label for="candidate-knowledge">
              <span>Do you know the candidate part's specification?</span>
              <select id="candidate-knowledge" v-model="candidateKnowledge">
                <option value="known">I know the candidate standard</option>
                <option value="unknown">I don’t know yet</option>
              </select>
            </label>
            <label v-if="candidateKnowledge === 'known'" for="candidate-value">
              <span>{{ activeRule?.candidateLabel ?? 'Candidate standard' }}</span>
              <select id="candidate-value" v-model="candidateValue" required>
                <option
                  v-for="option in activeRule?.values ?? []"
                  :key="option.code"
                  :value="option.code"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <p v-else class="unknown-note">
              <strong>Unknown is valid:</strong> The evaluator will pinpoint exactly which
              detail you need to ask the seller or mechanic before buying.
            </p>
          </fieldset>

          <button
            class="button button--primary"
            type="submit"
            :disabled="evaluating"
          >
            {{ evaluating ? 'Evaluating…' : '⚡ Evaluate Compatibility' }}
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>

      <!-- Evaluator Result Presentation -->
      <section
        v-if="result && presentation"
        class="compatibility-result"
        :class="`compatibility-result--${presentation.tone}`"
        aria-labelledby="result-title"
        aria-live="polite"
      >
        <header class="compatibility-result__header">
          <span class="compatibility-result__symbol" aria-hidden="true">
            {{ presentation.symbol }}
          </span>
          <div>
            <p class="technical-label">100% Deterministic Result</p>
            <h2 id="result-title">{{ presentation.label }}</h2>
            <p class="result-summary">{{ result.humanExplanation }}</p>
          </div>
        </header>

        <!-- Checks Performed -->
        <article
          v-for="check in result.checksPerformed"
          :key="check.ruleCode"
          class="compatibility-check"
        >
          <div class="compatibility-check__heading">
            <h3>{{ check.label }}</h3>
            <span class="check-status" :class="`check-status--${check.status}`">
              {{ check.status }}
            </span>
          </div>

          <!-- Side by Side Values -->
          <dl class="compatibility-values">
            <div>
              <dt>Saved on Bike</dt>
              <dd>{{ check.bikeValue ?? 'Unknown' }}</dd>
            </div>
            <div>
              <dt>Candidate Part</dt>
              <dd>{{ check.candidateValue ?? 'Unknown' }}</dd>
            </div>
          </dl>

          <p class="check-explanation">{{ check.humanExplanation }}</p>
          <details class="check-technical">
            <summary>Why this matters (Technical explanation)</summary>
            <p>{{ check.technicalExplanation }}</p>
          </details>
          <p v-if="check.possibleFix" class="possible-fix">
            <strong>Possible fix / Adapter:</strong> {{ check.possibleFix }}
          </p>
        </article>

        <!-- Missing info warning if applicable -->
        <div v-if="result.missingInformation.length" class="missing-block">
          <h3>Need one more detail</h3>
          <p>We need additional information to confirm this upgrade safely:</p>
          <ul>
            <li v-for="item in result.missingInformation" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="result-detail-block">
          <details>
            <summary>Full Rule Logic Breakdown</summary>
            <p>{{ result.technicalExplanation }}</p>
          </details>
          <p v-if="result.possibleFix" class="possible-fix">
            <strong>Next step:</strong> {{ result.possibleFix }}
          </p>
          <NuxtLink class="text-link" :to="`/garage/${selectedBikeId}`">
            Review this bike’s saved specifications in My Garage →
          </NuxtLink>
        </div>

        <footer class="provenance-block">
          <p class="technical-label">Rule Provenance &amp; Version</p>
          <ul>
            <li v-for="source in result.ruleProvenance" :key="source.ruleCode">
              <a :href="source.sourceUrl" target="_blank" rel="noreferrer">
                {{ source.sourceTitle }}
              </a>
              · version {{ source.ruleVersion }} · reviewed {{ source.reviewedAt }}
            </li>
          </ul>
        </footer>
      </section>
    </template>
  </div>
</template>

<style scoped>
.upgrade-page {
  gap: 2rem;
}

.guest-upgrade-box {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.25rem, 5vw, 2.5rem);
  border: 2px dashed var(--color-ink);
  border-radius: var(--radius-card);
  background: rgb(201 243 106 / 20%);
}

.guest-upgrade-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.guest-upgrade-icon {
  font-size: 2.8rem;
}

.guest-upgrade-box h2 {
  margin: 0;
  font-size: clamp(1.4rem, 5vw, 2rem);
  letter-spacing: -0.035em;
}

.guest-upgrade-box p {
  margin: 0.35rem 0 0;
  color: var(--color-asphalt);
  line-height: 1.55;
}

.upgrade-presets-section {
  display: grid;
  gap: 0.65rem;
  padding: 1.25rem;
  border: 1px solid var(--color-sand);
  border-radius: var(--radius-card);
  background: rgb(255 255 255 / 80%);
}

.preset-chips-bar {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.4rem;
  gap: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.preset-chip {
  flex: 0 0 auto;
  scroll-snap-align: start;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.75rem;
  background: var(--color-white);
  color: var(--color-ink);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 120ms ease;
}

.preset-chip:hover {
  border-color: var(--color-ink);
  background: rgb(201 243 106 / 25%);
  transform: translateY(-2px);
}

.compatibility-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0.85rem 0 0;
}

.compatibility-values > div {
  padding: 0.7rem;
  border: 1px solid var(--color-sand);
  border-radius: 0.65rem;
  background: var(--color-white);
}

.compatibility-values dt {
  color: var(--color-asphalt);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
}

.compatibility-values dd {
  margin: 0.2rem 0 0;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 800;
}

.result-summary {
  margin: 0.35rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-ink);
}

.check-status {
  padding: 0.25rem 0.55rem;
  border-radius: 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
}

.check-status--compatible {
  background: rgb(201 243 106 / 50%);
  color: #2b7a1e;
}

.check-status--conditional {
  background: #fde8b3;
  color: #8c6100;
}

.check-status--incompatible {
  background: rgb(255 140 117 / 35%);
  color: #8c261c;
}

.check-status--unknown {
  background: rgb(142 221 244 / 50%);
  color: #16697a;
}

.result-detail-block {
  margin: 0 1.25rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--color-sand);
  color: var(--color-asphalt);
  line-height: 1.55;
}

.result-detail-block summary {
  color: var(--color-ink);
  font-weight: 800;
  cursor: pointer;
}

.text-link {
  display: inline-block;
  margin-top: 0.75rem;
  font-weight: 800;
  color: var(--color-ink);
}

@media (max-width: 34rem) {
  .compatibility-values {
    grid-template-columns: 1fr;
  }
}
</style>
