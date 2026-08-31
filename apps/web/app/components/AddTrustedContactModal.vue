<script setup lang="ts">
import type {
  TrustedContact,
  TrustedContactResponse,
} from '@goweskit/contracts/safety';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', contact: TrustedContact): void;
}>();

const api = useApi();
const { triggerHaptic } = usePwa();
const { toast, alert } = useNotify();

const nameInputRef = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const errorMessage = ref('');

const form = reactive({
  name: '',
  phone: '',
  email: '',
  note: '',
});

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      errorMessage.value = '';
      nextTick(() => {
        nameInputRef.value?.focus();
      });
    } else {
      resetForm();
    }
  },
);

function resetForm(): void {
  form.name = '';
  form.phone = '';
  form.email = '';
  form.note = '';
  errorMessage.value = '';
}

async function handleSubmit(): Promise<void> {
  if (!form.name.trim()) {
    errorMessage.value = 'Nama lengkap wajib diisi.';
    return;
  }

  saving.value = true;
  errorMessage.value = '';
  triggerHaptic(20);

  try {
    const response = await api<TrustedContactResponse>('/trusted-contacts', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        note: form.note.trim() || null,
      },
    });

    toast.success(
      'Kontak Ditambahkan',
      `${response.contact.name} berhasil disimpan.`,
    );
    emit('created', response.contact);
    resetForm();
    emit('close');
  } catch (err: unknown) {
    errorMessage.value = getApiErrorMessage(err);
    alert.error('Gagal Menyimpan Kontak', errorMessage.value);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="isOpen"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        @click.self="emit('close')"
      >
        <div class="modal-card">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-info">
              <div class="modal-icon-badge">
                <GIcon name="users" size="sm" color="#17202A" filled />
              </div>
              <div>
                <h3 id="contact-modal-title" class="modal-title">
                  Tambah Kontak Darurat
                </h3>
                <p class="modal-subtitle">
                  Keluarga atau rekan gowes untuk menerima tautan pemantauan.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="modal-close-btn"
              aria-label="Tutup modal"
              @click="emit('close')"
            >
              <GIcon name="close" size="xs" />
            </button>
          </div>

          <!-- Form Body -->
          <form class="modal-form" @submit.prevent="handleSubmit">
            <p v-if="errorMessage" class="error-banner" role="alert">
              {{ errorMessage }}
            </p>

            <div class="form-field">
              <label for="modal-contact-name" class="field-label">
                <span>NAMA LENGKAP</span>
                <span class="required">*</span>
              </label>
              <div class="input-wrap">
                <span class="input-icon">
                  <GIcon name="users" size="xs" color="var(--color-asphalt)" />
                </span>
                <input
                  id="modal-contact-name"
                  ref="nameInputRef"
                  v-model="form.name"
                  type="text"
                  class="text-input"
                  placeholder="Contoh: Budi (Kakak)"
                  required
                />
              </div>
            </div>

            <div class="form-field">
              <label for="modal-contact-phone" class="field-label">
                <span>NOMOR WHATSAPP / HP</span>
              </label>
              <div class="input-wrap">
                <span class="input-icon">
                  <GIcon name="radar" size="xs" color="var(--color-asphalt)" />
                </span>
                <input
                  id="modal-contact-phone"
                  v-model="form.phone"
                  type="tel"
                  class="text-input"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-field">
                <label for="modal-contact-email" class="field-label">
                  <span>ALAMAT EMAIL</span>
                </label>
                <div class="input-wrap">
                  <span class="input-icon">
                    <GIcon
                      name="share"
                      size="xs"
                      color="var(--color-asphalt)"
                    />
                  </span>
                  <input
                    id="modal-contact-email"
                    v-model="form.email"
                    type="email"
                    class="text-input"
                    placeholder="Contoh: keluarga@example.com"
                  />
                </div>
              </div>

              <div class="form-field">
                <label for="modal-contact-note" class="field-label">
                  <span>CATATAN HUBUNGAN</span>
                </label>
                <div class="input-wrap">
                  <span class="input-icon">
                    <GIcon
                      name="route"
                      size="xs"
                      color="var(--color-asphalt)"
                    />
                  </span>
                  <input
                    id="modal-contact-note"
                    v-model="form.note"
                    type="text"
                    class="text-input"
                    placeholder="Contoh: Saudara / Rekan Peloton"
                  />
                </div>
              </div>
            </div>

            <!-- Actions Footer -->
            <div class="modal-actions">
              <button
                type="button"
                class="btn-secondary"
                @click="emit('close')"
              >
                Batal
              </button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="saving || !form.name.trim()"
              >
                <GIcon name="check" size="xs" />
                <span>{{ saving ? 'Menyimpan…' : 'Simpan Kontak' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(23, 32, 42, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-card {
  width: min(100%, 32rem);
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 1.5rem;
  background: var(--color-white);
  border: 1px solid var(--color-sand);
  box-shadow: 0 16px 48px rgba(23, 32, 42, 0.22);
  display: grid;
  gap: 1.25rem;
  padding: 1.35rem;
}

@media (max-width: 32rem) {
  .modal-card {
    padding: 1.15rem;
    border-radius: 1.25rem;
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.modal-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.modal-icon-badge {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.modal-subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.76rem;
  color: var(--color-asphalt);
  line-height: 1.35;
}

.modal-close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-sand);
  background: var(--color-canvas);
  color: var(--color-ink);
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 120ms ease;
}

.modal-close-btn:hover {
  background: var(--color-sand);
}

.modal-form {
  display: grid;
  gap: 0.95rem;
}

.error-banner {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.65rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 0.76rem;
  font-weight: 800;
}

.form-field {
  display: grid;
  gap: 0.35rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-asphalt);
  letter-spacing: 0.04em;
}

.required {
  color: #ef4444;
  font-weight: 900;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.text-input {
  width: 100%;
  padding: 0.65rem 0.85rem 0.65rem 2.35rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-sand);
  background: var(--color-canvas);
  color: var(--color-ink);
  font-size: 0.84rem;
  font-weight: 600;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    background-color 150ms ease;
}

.text-input:focus {
  background: var(--color-white);
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px rgba(201, 243, 106, 0.45);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 32rem) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgb(23 32 42 / 6%);
}

.btn-secondary {
  padding: 0.6rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-canvas);
  border: 1px solid var(--color-sand);
  color: var(--color-asphalt);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.btn-secondary:hover {
  background: var(--color-sand);
  color: var(--color-ink);
}

.btn-primary {
  padding: 0.6rem 1.25rem;
  border-radius: 0.75rem;
  background: var(--color-ink);
  color: var(--color-white);
  border: none;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition:
    transform 90ms ease,
    opacity 120ms ease;
  box-shadow: 0 4px 14px rgba(23, 32, 42, 0.15);
}

.btn-primary:hover:not(:disabled) {
  background: #0f172a;
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  opacity: 0;
  transform: scale(0.94) translateY(12px);
}
</style>
