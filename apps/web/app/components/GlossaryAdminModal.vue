<script setup lang="ts">
import type { CreateGlossaryTermRequest, GlossaryTerm } from '@goweskit/contracts';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'termCreated', term: GlossaryTerm): void;
}>();

const api = useApi();
const { toast } = useNotify();

const termName = ref('');
const termSlug = ref('');
const plainDefinition = ref('');
const technicalDefinition = ref('');
const aliasesInput = ref('');
const submitting = ref(false);
const errorMessage = ref('');

// Auto-generate slug from term name
watch(termName, (name) => {
  if (!termSlug.value || termSlug.value === slugify(termName.value.slice(0, -1))) {
    termSlug.value = slugify(name);
  }
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '');
}

function resetForm(): void {
  termName.value = '';
  termSlug.value = '';
  plainDefinition.value = '';
  technicalDefinition.value = '';
  aliasesInput.value = '';
  errorMessage.value = '';
}

async function handleSubmit(): Promise<void> {
  if (!termName.value || !termSlug.value || !plainDefinition.value || !technicalDefinition.value) {
    errorMessage.value = 'Semua field wajib diisi.';
    return;
  }

  submitting.value = true;
  errorMessage.value = '';

  const aliases = aliasesInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const payload: CreateGlossaryTermRequest = {
    slug: termSlug.value,
    term: termName.value,
    plainDefinition: plainDefinition.value,
    technicalDefinition: technicalDefinition.value,
    aliases,
    relatedComponentSlugs: [],
  };

  try {
    const created = await api<GlossaryTerm>('/learn/glossary', {
      method: 'POST',
      body: payload,
    });
    toast.success('Istilah Berhasil Ditambahkan', `"${created.term}" kini tersedia di kamus GowesKit.`);
    emit('termCreated', created);
    resetForm();
    emit('close');
  } catch (err: unknown) {
    errorMessage.value = getApiErrorMessage(err);
    toast.error('Gagal Menyimpan', errorMessage.value);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="admin-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-admin-title"
      @click.self="emit('close')"
    >
      <div class="admin-modal">
        <!-- Header -->
        <div class="admin-modal__header">
          <div>
            <span class="admin-tag">Admin &amp; Curator Workflow</span>
            <h2 id="glossary-admin-title" class="admin-title">Tambah Istilah Kamus Baru</h2>
          </div>
          <button
            type="button"
            class="close-btn"
            aria-label="Tutup Modal"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Form -->
        <form class="admin-form" @submit.prevent="handleSubmit">
          <p v-if="errorMessage" class="error-banner" role="alert">
            {{ errorMessage }}
          </p>

          <div class="form-group">
            <label for="admin-term-name">Nama Istilah / Standard</label>
            <input
              id="admin-term-name"
              v-model="termName"
              type="text"
              placeholder="Contoh: Universal Derailleur Hanger (UDH)"
              required
            />
          </div>

          <div class="form-group">
            <label for="admin-term-slug">Slug Identifier (URL Safe)</label>
            <input
              id="admin-term-slug"
              v-model="termSlug"
              type="text"
              placeholder="udh"
              required
            />
          </div>

          <div class="form-group">
            <label for="admin-plain-def">Definisi Bahasa Awam (Pemula)</label>
            <textarea
              id="admin-plain-def"
              v-model="plainDefinition"
              rows="3"
              placeholder="Jelaskan fungsi komponen ini dalam bahasa sederhana yang mudah dimengerti goweser pemula…"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="admin-tech-def">Definisi Teknis &amp; Kompatibilitas</label>
            <textarea
              id="admin-tech-def"
              v-model="technicalDefinition"
              rows="3"
              placeholder="Standar dimensi, toleransi drat, rentang pitch, atau panduan mekanik presisi…"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="admin-aliases">Alias / Sinonim (Pisahkan dengan koma)</label>
            <input
              id="admin-aliases"
              v-model="aliasesInput"
              type="text"
              placeholder="UDH, anting RD sram, universal hanger"
            />
          </div>

          <!-- Actions -->
          <div class="admin-actions">
            <button
              type="button"
              class="button button--secondary"
              @click="emit('close')"
            >
              Batal
            </button>
            <button
              type="submit"
              class="button button--primary"
              :disabled="submitting"
            >
              {{ submitting ? 'Menyimpan…' : '💾 Terbitkan Istilah' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.admin-backdrop {
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

.admin-modal {
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

.admin-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.admin-tag {
  font-size: 0.65rem;
  font-weight: 850;
  color: #0F766E;
  background: #F0FDFA;
  border: 1px solid #CCFBF1;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-block;
  margin-bottom: 0.35rem;
}

.admin-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 900;
  color: #17202A;
  letter-spacing: -0.02em;
}

.close-btn {
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-form {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: grid;
  gap: 1rem;
}

.error-banner {
  margin: 0;
  padding: 0.65rem 0.85rem;
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  color: #991B1B;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.form-group {
  display: grid;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #334155;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #CBD5E1;
  border-radius: 0.65rem;
  font-size: 0.85rem;
  color: #17202A;
  outline: none;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #17202A;
}

.admin-actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #E2E8F0;
}

.admin-actions button {
  flex: 1;
}
</style>
