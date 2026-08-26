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
const { user, initialized, refresh } = useAuth();
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
  <div class="page-stack">
    <header class="page-heading">
      <span class="status-chip status-chip--sky">Upgrade Lab v1</span>
      <h1>Check standards before buying a part.</h1>
      <p>
        GowesKit compares normalized technical values. It never uses brand as
        compatibility truth, and it will say when information is missing.
      </p>
    </header>

    <p v-if="loading" class="state-card" role="status">
      Preparing the workbench…
    </p>
    <div v-else-if="!user" class="state-card signed-out-state">
      <strong>Sign in to check a bike from your Garage.</strong>
      <p>The evaluator needs the standards saved against your own bike.</p>
      <NuxtLink class="button button--primary" to="/login">Sign in</NuxtLink>
    </div>
    <div v-else-if="bikes.length === 0" class="state-card signed-out-state">
      <strong>Add a bike before checking an upgrade.</strong>
      <p>Only a nickname and bicycle type are required to begin.</p>
      <NuxtLink class="button button--primary" to="/garage/new">
        Add a bike
      </NuxtLink>
    </div>

    <template v-else>
      <form
        class="form-card form-card--wide upgrade-form"
        @submit.prevent="evaluate"
      >
        <div class="form-stack">
          <label for="upgrade-bike">
            Bike
            <select id="upgrade-bike" v-model="selectedBikeId" required>
              <option v-for="bike in bikes" :key="bike.id" :value="bike.id">
                {{ bike.nickname }} · {{ bike.bicycleType.name }}
              </option>
            </select>
          </label>

          <label for="upgrade-rule">
            Standard to check
            <select id="upgrade-rule" v-model="selectedRuleCode" required>
              <option v-for="rule in rules" :key="rule.code" :value="rule.code">
                {{ rule.label }}
              </option>
            </select>
          </label>

          <fieldset class="spec-fieldset">
            <legend>Candidate component information</legend>
            <label for="candidate-knowledge">
              What do you know?
              <select id="candidate-knowledge" v-model="candidateKnowledge">
                <option value="known">I know the standard</option>
                <option value="unknown">I don’t know yet</option>
              </select>
            </label>
            <label v-if="candidateKnowledge === 'known'" for="candidate-value">
              {{ activeRule?.candidateLabel ?? 'Candidate value' }}
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
              Unknown is a valid answer. The result will tell you exactly what
              to confirm.
            </p>
          </fieldset>

          <button
            class="button button--primary"
            type="submit"
            :disabled="evaluating"
          >
            {{ evaluating ? 'Checking…' : 'Evaluate compatibility' }}
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="state-card state-card--error" role="alert">
        {{ errorMessage }}
      </p>

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
            <p class="technical-label">Deterministic result</p>
            <h2 id="result-title">{{ presentation.label }}</h2>
            <p>{{ result.humanExplanation }}</p>
          </div>
        </header>

        <article
          v-for="check in result.checksPerformed"
          :key="check.ruleCode"
          class="compatibility-check"
        >
          <div class="compatibility-check__heading">
            <h3>{{ check.label }}</h3>
            <span class="check-status">{{ check.status }}</span>
          </div>
          <p>{{ check.humanExplanation }}</p>
          <details>
            <summary>Technical explanation</summary>
            <p>{{ check.technicalExplanation }}</p>
          </details>
          <p v-if="check.possibleFix" class="possible-fix">
            <strong>Possible fix:</strong> {{ check.possibleFix }}
          </p>
        </article>

        <div v-if="result.missingInformation.length" class="missing-block">
          <h3>Missing information</h3>
          <ul>
            <li v-for="item in result.missingInformation" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <footer class="provenance-block">
          <p class="technical-label">Rule provenance</p>
          <ul>
            <li v-for="source in result.ruleProvenance" :key="source.ruleCode">
              <a :href="source.sourceUrl" target="_blank" rel="noreferrer">
                {{ source.sourceTitle }}
              </a>
              · rule {{ source.ruleVersion }} · reviewed {{ source.reviewedAt }}
            </li>
          </ul>
        </footer>
      </section>
    </template>
  </div>
</template>
