<script setup lang="ts">
import type { Bike, GenerateRideStoryResponse } from '@goweskit/contracts';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    initialDistance?: number;
    initialElevation?: number;
    initialDurationMinutes?: number;
    initialRouteNote?: string;
    bikeNickname?: string;
  }>(),
  {
    initialDistance: 45.8,
    initialElevation: 580,
    initialDurationMinutes: 105,
    initialRouteNote: 'Morning Gravel Loop Sentul',
    bikeNickname: 'Polygon Siskiu T7',
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const api = useApi();
const { toast } = useNotify();

// Form & Telemetry State
const rideForm = reactive({
  title: 'Morning Gravel & Hills Rush',
  distanceKm: props.initialDistance,
  elevationM: props.initialElevation,
  durationMinutes: props.initialDurationMinutes,
  avgSpeedKmH: 26.2,
  caloriesKcal: 980,
  temperatureC: 25,
  bikeName: props.bikeNickname,
  theme: 'cyber' as 'cyber' | 'alpine' | 'speed' | 'cafe' | 'minimal',
  aspectRatio: 'story' as 'story' | 'post',
  activeSticker: 'kom' as 'kom' | 'cafe' | 'beast' | 'finished' | 'none',
  bgPreset: 'mountain' as 'mountain' | 'sunset' | 'gravel' | 'night' | 'cafe' | 'custom',
  customPhotoUrl: '',
});

// AI Agentic Storyteller State
const isAiGenerating = ref(false);
const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight: 'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  captions: {
    athlete: '45.8km • +580m elevation. Consistency beats talent when talent doesn’t show up. ⚡🚴‍♂️ #GowesKit #CyclingLife',
    humor: 'Niatnya gowes santai cari kopi, ujung-ujungnya disiksa tanjakan tapi finish ganteng dan kenyang. ☕🔥 #GowesSantai',
    technical: 'Testing 45.8km on gravel & climbs. 1x12 shifting buttery smooth with 26.2 km/h avg pace. 🔧 #BikeSpecs',
  },
  mechanicTip: '💡 Saran AI Mekanik: Setelah elevasi +580m, cek tegangan rantai dan lumasi kembali drivetrain malam ini.',
});

const isExporting = ref(false);

// Background Presets
const PRESET_BACKGROUNDS = {
  mountain: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1080&q=80',
  sunset: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1080&q=80',
  gravel: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1080&q=80',
  night: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1080&q=80',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1080&q=80',
};

const currentBackgroundSrc = computed(() => {
  if (rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl) {
    return rideForm.customPhotoUrl;
  }
  return PRESET_BACKGROUNDS[rideForm.bgPreset as keyof typeof PRESET_BACKGROUNDS] || PRESET_BACKGROUNDS.mountain;
});

function handlePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (typeof e.target?.result === 'string') {
      rideForm.customPhotoUrl = e.target.result;
      rideForm.bgPreset = 'custom';
      toast.success('Foto Berhasil Diunggah!', 'Foto gowes siap dikombinasikan dengan template.');
    }
  };
  reader.readAsDataURL(file);
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

// 🤖 Agentic AI Generator (calls Backend API /api/v1/ride-flex/generate-story with offline fallback)
async function generateAiStory() {
  isAiGenerating.value = true;
  try {
    const res = await api<GenerateRideStoryResponse>(
      '/ride-flex/generate-story',
      {
        method: 'POST',
        body: {
          distanceKm: rideForm.distanceKm,
          elevationGainMeters: rideForm.elevationM,
          durationMinutes: rideForm.durationMinutes,
          bikeName: rideForm.bikeName || undefined,
          weatherTempC: rideForm.temperatureC || undefined,
        },
      },
    );

    rideForm.title = res.title;
    rideForm.avgSpeedKmH = res.averageSpeedKmh;
    rideForm.caloriesKcal = res.estimatedCaloriesKcal;
    aiRecap.value = {
      title: res.title,
      highlight: `${res.highlight} Estimasi bakar kalori ~${res.estimatedCaloriesKcal} kcal (${res.foodEquivalency}).`,
      captions: res.captions,
      mechanicTip: `💡 Rekomendasi Mekanik AI (${res.climbGradeScore}): ${res.mechanicTip}`,
    };
    toast.success('✨ AI Recap Dihasilkan!', 'Judul, analisis kalori, dan caption gowes siap digunakan.');
  } catch {
    // Offline/heuristic fallback
    const distance = rideForm.distanceKm;
    const elev = rideForm.elevationM;
    const speed = Number(
      (distance / Math.max(rideForm.durationMinutes / 60, 0.05)).toFixed(1),
    );
    rideForm.avgSpeedKmH = speed;

    const titles = [
      `Epic ${distance}km: Menaklukkan Tanjakan & Kopi Gowes`,
      `Pagi Santai Tapi Rantai Menjerit · ${distance}km`,
      `Gravel Dust Odyssey: +${elev}m Elevation Rush`,
      `Menolak Wacana: ${distance}km Loop Terlampaui ⚡`,
    ];
    const randomTitle =
      titles[Math.floor(Math.random() * titles.length)] ?? titles[0]!;
    rideForm.title = randomTitle;

    aiRecap.value = {
      title: randomTitle,
      highlight: `Kamu membakar ~${rideForm.caloriesKcal} kalori dan menaklukkan elevasi +${elev}m dengan kecepatan rata-rata ${speed} km/jam! Output tenaga luar biasa solid.`,
      captions: {
        athlete: `Pushed the limits today: ${distance}km • +${elev}m elevation gain • ${speed} km/h avg pace. Building power one pedal stroke at a time. ⚡🚴 #GowesKit #NoExcuses`,
        humor: `Katanya gowes tipis-tipis cari sarapan, nyatanya disiksa tanjakan +${elev}m. Yang penting outfit matching dan foto Instagram aman! ☕🚴‍♂️ #GowesSantai`,
        technical: `Gowes ${distance}km menempuh medan tanjakan. Tekanan ban dan gearing 1x12 bekerja optimal tanpa kendala mekanis. ⚙️ #GowesKitSpecs`,
      },
      mechanicTip: `💡 Rekomendasi Mekanik AI: Rantai telah bekerja keras di elevasi +${elev}m. Bersihkan debu dan lumasi sebelum gowes berikutnya.`,
    };
    toast.success('✨ AI Recap Dihasilkan!', 'Judul dan caption gowes siap digunakan.');
  } finally {
    isAiGenerating.value = false;
  }
}

async function copyCaption(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Caption Disalin!', 'Siap ditempel ke Instagram, Strava, atau WhatsApp.');
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

// Canvas HD Render & Export
async function renderCanvas(format: 'story' | 'post'): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context error');

  const isStory = format === 'story';
  canvas.width = 1080;
  canvas.height = isStory ? 1920 : 1080;

  // 1. Draw Background Image
  try {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      bgImg.onload = resolve;
      bgImg.onerror = resolve;
      bgImg.src = currentBackgroundSrc.value;
    });
    if (bgImg.width > 0) {
      // cover crop
      const hRatio = canvas.width / bgImg.width;
      const vRatio = canvas.height / bgImg.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - bgImg.width * ratio) / 2;
      const centerShiftY = (canvas.height - bgImg.height * ratio) / 2;
      ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, centerShiftX, centerShiftY, bgImg.width * ratio, bgImg.height * ratio);
    } else {
      ctx.fillStyle = '#17202A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } catch {
    ctx.fillStyle = '#17202A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Cinematic Gradient Overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.7)');
  gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.15)');
  gradient.addColorStop(0.65, 'rgba(15, 23, 42, 0.6)');
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Top Branding Pill
  ctx.fillStyle = 'rgba(23, 32, 42, 0.85)';
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, isStory ? 100 : 60, 420, 56, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('⚡ GOWESKIT · RIDE PASSPORT', 95, isStory ? 138 : 98);

  // 4. Sticker Badge if selected
  if (rideForm.activeSticker !== 'none') {
    const stickerText = {
      kom: '👑 KOM / PR HUNTER',
      cafe: '☕ KOPI GOWES APPROVED',
      beast: '⛰️ ELEVATION BEAST',
      finished: '✓ 100% RIDE COMPLETED',
    }[rideForm.activeSticker];

    if (stickerText) {
      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(canvas.width - 450, isStory ? 100 : 60, 380, 56, 28);
      ctx.fill();

      ctx.fillStyle = '#17202A';
      ctx.font = '900 24px sans-serif';
      ctx.fillText(stickerText, canvas.width - 425, isStory ? 138 : 98);
    }
  }

  // 5. Main Hero Stats (Large bold numbers)
  const statsBoxY = isStory ? 1200 : 540;

  // Ride Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px sans-serif';
  ctx.fillText(rideForm.title.slice(0, 32), 70, statsBoxY - 50);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, 70, statsBoxY);

  // Stats Card Backdrop
  ctx.fillStyle = 'rgba(23, 32, 42, 0.9)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, statsBoxY + 30, canvas.width - 140, isStory ? 520 : 380, 32);
  ctx.fill();
  ctx.stroke();

  // Grid of 4 Key Metrics
  const cellW = (canvas.width - 140) / 2;
  const metrics = [
    { label: 'JARAK TOTAL', val: `${rideForm.distanceKm} km`, color: '#C9F36A' },
    { label: 'ELEVASI TANJAKAN', val: `+${rideForm.elevationM} m`, color: '#38BDF8' },
    { label: 'WAKTU GOWES', val: formatDuration(rideForm.durationMinutes), color: '#FFFFFF' },
    { label: 'RATA-RATA SPEED', val: `${rideForm.avgSpeedKmH} km/h`, color: '#FDE047' },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 110 + col * (cellW - 20);
    const y = statsBoxY + 110 + row * (isStory ? 180 : 130);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(m.label, x, y);

    ctx.fillStyle = m.color;
    ctx.font = '900 58px monospace';
    ctx.fillText(m.val, x, y + 60);
  });

  // 6. Watermark Footer
  ctx.fillStyle = 'rgba(201, 243, 106, 0.9)';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('⚡ POWERED BY GOWESKIT RIDE ENGINE · GOWESKIT.ID', 80, canvas.height - 40);

  return canvas;
}

async function downloadStoryImage() {
  isExporting.value = true;
  try {
    const canvas = await renderCanvas(rideForm.aspectRatio);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Blob creation failed');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const formatName = rideForm.aspectRatio === 'post' ? 'Post_1x1' : 'Story_9x16';
    link.download = `GowesKit_RideFlex_${formatName}.png`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Poster Gowes HD Terunduh!', 'Format pas untuk Instagram Story / WhatsApp Status.');
  } catch (err) {
    console.error('Export error:', err);
    toast.error('Gagal mengunduh', 'Silakan coba lagi.');
  } finally {
    isExporting.value = false;
  }
}

async function shareToMedia() {
  isExporting.value = true;
  try {
    const canvas = await renderCanvas(rideForm.aspectRatio);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Blob creation failed');

    const file = new File([blob], 'GowesKit_RideFlex.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: rideForm.title,
        text: `Hasil gowes ${rideForm.distanceKm}km dengan elevasi +${rideForm.elevationM}m di GowesKit!`,
      });
      toast.success('Berhasil Dibagikan!', 'Poster gowes siap diposting ke medsos.');
    } else {
      await copyCaption(aiRecap.value.captions.athlete);
      await downloadStoryImage();
    }
  } catch (err: unknown) {
    if ((err as Error)?.name !== 'AbortError') {
      await copyCaption(aiRecap.value.captions.athlete);
    }
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="studio-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="studio-title"
      @click.self="emit('close')"
    >
      <div class="studio-modal-card">
        <!-- Header Top -->
        <div class="studio-modal__header">
          <div class="studio-badge">
            <span class="studio-dot"></span>
            <span>RIDE FLEX STUDIO &amp; AI COACH</span>
          </div>
          <button
            type="button"
            class="studio-close-btn"
            aria-label="Tutup Studio"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="studio-body-layout">
          <!-- LEFT / TOP: LIVE POSTER PREVIEW -->
          <div class="poster-preview-pane">
            <div
              class="live-poster"
              :class="`live-poster--${rideForm.aspectRatio}`"
              :style="{ backgroundImage: `url(${currentBackgroundSrc})` }"
            >
              <!-- Gradient Overlay -->
              <div class="live-poster__overlay"></div>

              <!-- Top Bar -->
              <div class="poster-top-bar">
                <span class="poster-brand-chip">⚡ GOWESKIT</span>
                <span v-if="rideForm.activeSticker !== 'none'" class="poster-sticker-tag">
                  {{
                    {
                      kom: '👑 KOM HUNTER',
                      cafe: '☕ KOPI APPROVED',
                      beast: '⛰️ ELEVATION BEAST',
                      finished: '✓ 100% FINISHED',
                    }[rideForm.activeSticker]
                  }}
                </span>
              </div>

              <!-- Telemetry Overlay Card -->
              <div class="poster-stats-card">
                <div class="poster-title-line">
                  <h3>{{ rideForm.title }}</h3>
                  <small>🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C</small>
                </div>

                <div class="poster-stats-grid">
                  <div class="stat-box">
                    <span class="stat-lbl">Jarak</span>
                    <strong class="stat-val stat-val--lime">{{ rideForm.distanceKm }} km</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-lbl">Elevasi</span>
                    <strong class="stat-val stat-val--sky">+{{ rideForm.elevationM }} m</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-lbl">Waktu</span>
                    <strong class="stat-val">{{ formatDuration(rideForm.durationMinutes) }}</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-lbl">Avg Speed</span>
                    <strong class="stat-val stat-val--yellow">{{ rideForm.avgSpeedKmH }} km/h</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT / CONTROLS: EDITING & AI STORYTELLER -->
          <div class="studio-controls-pane">
            <!-- 🤖 AGENTIC AI STORYTELLER CARD -->
            <div class="ai-coach-card">
              <div class="ai-card__header">
                <span class="ai-spark-icon">✨</span>
                <div>
                  <strong>Agentic AI Ride Coach &amp; Storyteller</strong>
                  <small>Buat judul epik, caption medsos, dan analisa gowes 1-klik</small>
                </div>
              </div>

              <p class="ai-recap-text">
                {{ aiRecap.highlight }}
              </p>

              <div class="ai-captions-shelf">
                <div class="caption-item">
                  <div class="caption-top">
                    <span>🔥 Gaya Atlet / Serius</span>
                    <button type="button" class="copy-cap-btn" @click="copyCaption(aiRecap.captions.athlete)">Salin</button>
                  </div>
                  <p>{{ aiRecap.captions.athlete }}</p>
                </div>

                <div class="caption-item">
                  <div class="caption-top">
                    <span>☕ Gaya Goweser Santai</span>
                    <button type="button" class="copy-cap-btn" @click="copyCaption(aiRecap.captions.humor)">Salin</button>
                  </div>
                  <p>{{ aiRecap.captions.humor }}</p>
                </div>
              </div>

              <div class="ai-mechanic-box">
                {{ aiRecap.mechanicTip }}
              </div>

              <button
                type="button"
                class="ai-generate-btn"
                :disabled="isAiGenerating"
                @click="generateAiStory"
              >
                <span>✨</span>
                <span>{{ isAiGenerating ? 'AI Sedang Menganalisis Gowes…' : 'Generate AI Story & Caption Baru' }}</span>
              </button>
            </div>

            <!-- CUSTOMIZER CONTROLS -->
            <div class="customizer-section">
              <h4 class="section-heading">🎨 Kustomisasi Tampilan &amp; Foto</h4>

              <!-- Format & Sticker Pickers -->
              <div class="control-row">
                <div class="control-col">
                  <label class="control-lbl">Format Ukuran</label>
                  <div class="pill-toggle-group">
                    <button
                      type="button"
                      class="pill-toggle"
                      :class="{ 'pill-toggle--active': rideForm.aspectRatio === 'story' }"
                      @click="rideForm.aspectRatio = 'story'"
                    >
                      📱 Story 9:16
                    </button>
                    <button
                      type="button"
                      class="pill-toggle"
                      :class="{ 'pill-toggle--active': rideForm.aspectRatio === 'post' }"
                      @click="rideForm.aspectRatio = 'post'"
                    >
                      🖼️ Post 1:1
                    </button>
                  </div>
                </div>

                <div class="control-col">
                  <label class="control-lbl">Sticker Badge</label>
                  <select v-model="rideForm.activeSticker" class="control-select">
                    <option value="kom">👑 KOM Hunter</option>
                    <option value="cafe">☕ Kopi Approved</option>
                    <option value="beast">⛰️ Elevation Beast</option>
                    <option value="finished">✓ 100% Finished</option>
                    <option value="none">Tanpa Sticker</option>
                  </select>
                </div>
              </div>

              <!-- Photo Background Presets -->
              <div class="bg-picker-group">
                <label class="control-lbl">Foto Latar Belakang</label>
                <div class="bg-preset-pills">
                  <button
                    type="button"
                    class="bg-pill"
                    :class="{ 'bg-pill--active': rideForm.bgPreset === 'mountain' }"
                    @click="rideForm.bgPreset = 'mountain'"
                  >
                    🏔️ Mountain
                  </button>
                  <button
                    type="button"
                    class="bg-pill"
                    :class="{ 'bg-pill--active': rideForm.bgPreset === 'sunset' }"
                    @click="rideForm.bgPreset = 'sunset'"
                  >
                    🌅 Sunset
                  </button>
                  <button
                    type="button"
                    class="bg-pill"
                    :class="{ 'bg-pill--active': rideForm.bgPreset === 'gravel' }"
                    @click="rideForm.bgPreset = 'gravel'"
                  >
                    🌾 Gravel
                  </button>
                  <button
                    type="button"
                    class="bg-pill"
                    :class="{ 'bg-pill--active': rideForm.bgPreset === 'night' }"
                    @click="rideForm.bgPreset = 'night'"
                  >
                    ⚡ Cyber Night
                  </button>
                  <label class="bg-upload-btn">
                    <span>📷 Upload Foto Anda</span>
                    <input type="file" accept="image/*" class="sr-only" @change="handlePhotoUpload" />
                  </label>
                </div>
              </div>

              <!-- Adjustable Telemetry Inputs -->
              <div class="telemetry-inputs-grid">
                <div class="input-item">
                  <label>Jarak (km)</label>
                  <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
                </div>
                <div class="input-item">
                  <label>Elevasi (+m)</label>
                  <input v-model.number="rideForm.elevationM" type="number" />
                </div>
                <div class="input-item">
                  <label>Durasi (Menit)</label>
                  <input v-model.number="rideForm.durationMinutes" type="number" />
                </div>
                <div class="input-item">
                  <label>Sepeda</label>
                  <input v-model="rideForm.bikeName" type="text" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM ACTIONS -->
        <div class="studio-bottom-bar">
          <button
            type="button"
            class="action-cta action-cta--share"
            :disabled="isExporting"
            @click="shareToMedia"
          >
            <span>📲</span>
            <span>{{ isExporting ? 'Memproses Poster…' : 'Share Langsung ke Medsos' }}</span>
          </button>

          <button
            type="button"
            class="action-cta action-cta--download"
            :disabled="isExporting"
            @click="downloadStoryImage"
          >
            <span>🖼️</span>
            <span>Unduh HD (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.studio-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.studio-modal-card {
  position: relative;
  width: 100%;
  max-width: 58rem;
  background: #17202A;
  border: 1.5px solid rgba(201, 243, 106, 0.35);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 94vh;
}

.studio-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: #0F172A;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.studio-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.studio-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
}

.studio-close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Body Layout */
.studio-body-layout {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
}

@media (min-width: 768px) {
  .studio-body-layout {
    flex-direction: row;
  }
}

/* Left Poster Preview */
.poster-preview-pane {
  background: #0B1120;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .poster-preview-pane {
    width: 44%;
    border-bottom: none;
    border-right: 1.5px solid rgba(255, 255, 255, 0.1);
  }
}

.live-poster {
  position: relative;
  width: 100%;
  max-width: 18rem;
  background-size: cover;
  background-position: center;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1.5px solid rgba(201, 243, 106, 0.3);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
}

.live-poster--story {
  aspect-ratio: 9 / 16;
}

.live-poster--post {
  aspect-ratio: 1 / 1;
}

.live-poster__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.15) 40%, rgba(15, 23, 42, 0.85) 100%);
  pointer-events: none;
}

.poster-top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.poster-brand-chip {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  background: rgba(23, 32, 42, 0.85);
  border: 1px solid var(--color-chain-lime);
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

.poster-sticker-tag {
  font-size: 0.62rem;
  font-weight: 900;
  background: var(--color-chain-lime);
  color: #17202A;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
}

.poster-stats-card {
  position: relative;
  z-index: 2;
  background: rgba(23, 32, 42, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 0.95rem;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.poster-title-line h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  color: #FFFFFF;
  line-height: 1.2;
}

.poster-title-line small {
  font-size: 0.68rem;
  color: #94A3B8;
  font-weight: 700;
}

.poster-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-lbl {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  color: #94A3B8;
  text-transform: uppercase;
}

.stat-val {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 900;
  color: #FFFFFF;
}

.stat-val--lime {
  color: var(--color-chain-lime);
}

.stat-val--sky {
  color: #38BDF8;
}

.stat-val--yellow {
  color: #FDE047;
}

/* Right Controls Pane */
.studio-controls-pane {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  overflow-y: auto;
}

/* AI Coach Card */
.ai-coach-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 1.5px solid rgba(201, 243, 106, 0.35);
  border-radius: 1.15rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ai-card__header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-spark-icon {
  font-size: 1.4rem;
}

.ai-card__header strong {
  font-size: 0.86rem;
  color: #FFFFFF;
  display: block;
}

.ai-card__header small {
  font-size: 0.68rem;
  color: #94A3B8;
  display: block;
}

.ai-recap-text {
  margin: 0;
  font-size: 0.78rem;
  color: #CBD5E1;
  line-height: 1.45;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
}

.ai-captions-shelf {
  display: grid;
  gap: 0.5rem;
}

.caption-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.65rem;
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.caption-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-chain-lime);
}

.copy-cap-btn {
  border: none;
  background: rgba(201, 243, 106, 0.15);
  color: var(--color-chain-lime);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.1rem 0.45rem;
  border-radius: 0.35rem;
  cursor: pointer;
}

.caption-item p {
  margin: 0;
  font-size: 0.72rem;
  color: #94A3B8;
  line-height: 1.35;
}

.ai-mechanic-box {
  font-size: 0.72rem;
  color: #38BDF8;
  background: rgba(2, 132, 199, 0.12);
  border: 1px solid rgba(2, 132, 199, 0.25);
  padding: 0.45rem 0.65rem;
  border-radius: 0.55rem;
}

.ai-generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #17202A;
  font-size: 0.78rem;
  font-weight: 850;
  border: none;
  cursor: pointer;
  transition: all 100ms ease;
}

.ai-generate-btn:active {
  transform: scale(0.97);
}

/* Customizer Section */
.customizer-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-heading {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 850;
  color: #FFFFFF;
}

.control-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.control-lbl {
  font-size: 0.68rem;
  font-weight: 800;
  color: #94A3B8;
  margin-bottom: 0.25rem;
  display: block;
}

.pill-toggle-group {
  display: flex;
  gap: 0.35rem;
}

.pill-toggle {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.1);
  color: #CBD5E1;
  font-size: 0.72rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
}

.pill-toggle--active {
  background: var(--color-chain-lime);
  color: #17202A;
}

.control-select {
  width: 100%;
  padding: 0.4rem 0.65rem;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
  font-weight: 700;
}

.bg-preset-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.bg-pill {
  padding: 0.35rem 0.65rem;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.08);
  color: #CBD5E1;
  font-size: 0.72rem;
  font-weight: 750;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.bg-pill--active {
  background: var(--color-chain-lime);
  color: #17202A;
  border-color: var(--color-chain-lime);
}

.bg-upload-btn {
  padding: 0.35rem 0.65rem;
  border-radius: 0.55rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38BDF8;
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px dashed #38BDF8;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.telemetry-inputs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.input-item label {
  font-size: 0.65rem;
  color: #94A3B8;
  font-weight: 750;
}

.input-item input {
  padding: 0.35rem 0.55rem;
  border-radius: 0.45rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  font-size: 0.78rem;
  font-weight: 750;
}

/* Bottom Bar */
.studio-bottom-bar {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background: #0F172A;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
  border: none;
  transition: all 100ms ease;
}

.action-cta:active {
  transform: scale(0.97);
}

.action-cta--share {
  background: var(--color-chain-lime);
  color: #17202A;
  box-shadow: 0 2px 10px rgba(201, 243, 106, 0.3);
}

.action-cta--download {
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
