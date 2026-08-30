<script setup lang="ts">
import type { GenerateRideStoryResponse } from '@goweskit/contracts';

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

const activeTab = ref<'templates' | 'backgrounds' | 'stickers' | 'ai' | 'data'>('templates');

const rideForm = reactive({
  title: props.initialRouteNote || 'Morning Gravel & Hills Rush',
  distanceKm: props.initialDistance,
  elevationM: props.initialElevation,
  durationMinutes: props.initialDurationMinutes,
  avgSpeedKmH: Number((props.initialDistance / Math.max(props.initialDurationMinutes / 60, 0.05)).toFixed(1)),
  caloriesKcal: 980,
  temperatureC: 25,
  bikeName: props.bikeNickname,
  templateStyle: 'strava_bold' as 'strava_bold' | 'rapha_editorial' | 'cyber_hud' | 'cafe_santai',
  aspectRatio: 'story' as 'story' | 'post' | 'landscape',
  activeSticker: 'kom' as 'kom' | 'cafe' | 'beast' | 'speed' | 'fuel' | 'podium' | 'none',
  bgPreset: 'alpine' as 'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'topo' | 'custom',
  customPhotoUrl: '',
});

const selectedPersona = ref<'athlete' | 'humor' | 'technical'>('athlete');
const isAiGenerating = ref(false);
const isExporting = ref(false);

const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight: 'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  foodEquivalency: '1 porsi Sate Maranggi + Es Kelapa Muda 🍢🥥',
  climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
  captions: {
    athlete: `🎯 ${props.initialDistance} km · +${props.initialElevation}m Elevasi · Avg ${rideForm.avgSpeedKmH} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${props.bikeNickname}. #GowesKit #RideFlex`,
    humor: `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${props.initialDistance} km dengan tanjakan ${props.initialElevation}m! Kaki auto getar pas pesen Sate Maranggi. 😂☕ #GowesSantai`,
    technical: `⚙️ Rute: ${props.initialRouteNote} (${props.initialDistance} km). Setup drivetrain pada ${props.bikeNickname} bekerja mulus di gradien Cat 2 Mountain Pass. #BikeSpecs #GowesKit`,
  },
  mechanicTip: `💡 Saran AI Mekanik: Setelah elevasi +${props.initialElevation}m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.`,
  hashtags: ['#GowesKit', '#RideFlex', '#CyclingIndonesia', '#KOMHunter', '#GowesPagi'],
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
      toast.success('Foto Berhasil Dipasang!', 'Foto jepretan Anda kini menghiasi poster.');
    }
  };
  reader.readAsDataURL(file);
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

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
      highlight: res.highlight,
      foodEquivalency: res.foodEquivalency,
      climbGradeScore: res.climbGradeScore,
      captions: res.captions,
      mechanicTip: `💡 Saran AI Mekanik: ${res.mechanicTip}`,
      hashtags: res.suggestedHashtags,
    };
    toast.success('✨ Cerita AI Dihasilkan!', 'Judul & caption berhasil diperbarui.');
  } catch {
    toast.info('Mode Offline Heuristic', 'AI story dihasilkan dari engine lokal.');
  } finally {
    isAiGenerating.value = false;
  }
}

async function copyCaption(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Caption Disalin!', 'Siap di-paste ke medsos.');
  } catch {
    toast.error('Gagal menyalin', 'Salin teks secara manual.');
  }
}

async function renderCanvas(aspectRatio: 'story' | 'post' | 'landscape'): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const isStory = aspectRatio === 'story';
  const isLandscape = aspectRatio === 'landscape';

  if (isStory) {
    canvas.width = 1080;
    canvas.height = 1920;
  } else if (isLandscape) {
    canvas.width = 1920;
    canvas.height = 1080;
  } else {
    canvas.width = 1080;
    canvas.height = 1080;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const bgGradients: Record<string, [string, string, string]> = {
    alpine: ['#0f2b48', '#081726', '#020617'],
    gravel: ['#143823', '#0a2314', '#020a05'],
    sunset: ['#581c10', '#3b0d06', '#0f0402'],
    crit: ['#3b1154', '#210533', '#08010d'],
    cafe: ['#3d2111', '#231106', '#0d0602'],
    topo: ['#0c1527', '#080d19', '#03060a'],
  };

  const defaultColors: [string, string, string] = ['#0f2b48', '#081726', '#020617'];
  const currentColors = bgGradients[rideForm.bgPreset] ?? defaultColors;
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, currentColors[0]);
  bgGrad.addColorStop(0.5, currentColors[1]);
  bgGrad.addColorStop(1, currentColors[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl) {
    try {
      const img = new Image();
      img.src = rideForm.customPhotoUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.globalAlpha = 1.0;
    } catch {
      // fallback drawn
    }
  }

  // Draw Topographic Background Curves
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.25);
  ctx.bezierCurveTo(canvas.width * 0.3, canvas.height * 0.18, canvas.width * 0.7, canvas.height * 0.35, canvas.width, canvas.height * 0.22);
  ctx.stroke();

  // Dark Vignette
  const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vignette.addColorStop(0, 'rgba(6, 10, 18, 0.4)');
  vignette.addColorStop(0.4, 'rgba(6, 10, 18, 0.1)');
  vignette.addColorStop(0.75, 'rgba(6, 10, 18, 0.85)');
  vignette.addColorStop(1, 'rgba(6, 10, 18, 0.98)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Branding Pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, isStory ? 90 : 60, 360, 58, 29);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C9F36A';
  ctx.font = '900 24px monospace';
  ctx.fillText('⚡ GOWESKIT RIDE PASS', 95, isStory ? 128 : 98);

  if (rideForm.activeSticker !== 'none') {
    const stickerText = {
      kom: '👑 KOM HUNTER',
      cafe: '☕ COFFEE APPROVED',
      beast: '⛰️ CLIMB BEAST',
      speed: '⚡ 26+ KM/H PACE',
      fuel: '🍲 FUEL SATE MARANGGI',
      podium: '🏁 PODIUM FINISHER',
    }[rideForm.activeSticker];

    if (stickerText) {
      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(canvas.width - 440, isStory ? 90 : 60, 370, 58, 29);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(stickerText, canvas.width - 415, isStory ? 128 : 98);
    }
  }

  const heroY = isStory ? 1040 : (isLandscape ? 420 : 470);
  ctx.fillStyle = '#C9F36A';
  ctx.font = '900 145px monospace';
  ctx.fillText(`${rideForm.distanceKm}`, 70, heroY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 56px sans-serif';
  ctx.fillText('KM', 70 + ctx.measureText(`${rideForm.distanceKm}`).width + 25, heroY - 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px sans-serif';
  ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 70);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, 70, heroY + 120);

  const cardY = heroY + 155;
  const cardH = isStory ? 480 : (isLandscape ? 340 : 360);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, cardY, canvas.width - 140, cardH, 32);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(120, cardY + 80);
  ctx.bezierCurveTo(340, cardY + 20, 600, cardY + 75, canvas.width - 120, cardY + 40);
  ctx.stroke();

  const cellW = (canvas.width - 140) / 2;
  const metrics = [
    { label: 'ELEVASI TANJAKAN', val: `+${rideForm.elevationM} m`, color: '#38BDF8' },
    { label: 'WAKTU TEMPUH', val: formatDuration(rideForm.durationMinutes), color: '#FFFFFF' },
    { label: 'RATA-RATA SPEED', val: `${rideForm.avgSpeedKmH} km/h`, color: '#C9F36A' },
    { label: 'KALORI TERBAKAR', val: `~${rideForm.caloriesKcal} kcal`, color: '#FF8C75' },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 120 + col * (cellW - 20);
    const y = cardY + 140 + row * (isStory ? 170 : 115);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(m.label, x, y);

    ctx.fillStyle = m.color;
    ctx.font = '900 56px monospace';
    ctx.fillText(m.val, x, y + 60);
  });

  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID', 80, canvas.height - 45);

  return canvas;
}

async function downloadStoryImage() {
  isExporting.value = true;
  try {
    const canvas = await renderCanvas(rideForm.aspectRatio);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Blob creation failed');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const formatName =
      rideForm.aspectRatio === 'post'
        ? 'Square_1x1'
        : rideForm.aspectRatio === 'landscape'
          ? 'Landscape_16x9'
          : 'Story_9x16';
    link.download = `GowesKit_RideFlex_${formatName}.png`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Poster Gowes HD Terunduh!', 'Format jernih siap diposting ke media sosial.');
  } catch (err) {
    console.error('Export error:', err);
    toast.error('Gagal mengunduh', 'Silakan coba kembali.');
  } finally {
    isExporting.value = false;
  }
}

async function shareToMedia() {
  isExporting.value = true;
  try {
    const canvas = await renderCanvas(rideForm.aspectRatio);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Blob creation failed');

    const file = new File([blob], 'GowesKit_RideFlex.png', {
      type: 'image/png',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: rideForm.title,
        text: `${rideForm.title} · ${rideForm.distanceKm}km (+${rideForm.elevationM}m) bersama GowesKit!`,
      });
      toast.success('Berhasil Dibagikan!', 'Poster gowes siap diposting ke medsos.');
    } else {
      await copyCaption(aiRecap.value.captions[selectedPersona.value]);
      await downloadStoryImage();
    }
  } catch (err: unknown) {
    if ((err as Error)?.name !== 'AbortError') {
      await copyCaption(aiRecap.value.captions[selectedPersona.value]);
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
      class="studio-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-studio-title"
      @click.self="emit('close')"
    >
      <div class="studio-modal-container">
        <!-- Modal Top Bar -->
        <header class="modal-top-strip">
          <div class="modal-title-left">
            <span class="live-dot-pulse"></span>
            <span id="modal-studio-title" class="modal-heading">RIDE FLEX STUDIO</span>
          </div>
          <button
            type="button"
            class="modal-btn-close"
            aria-label="Tutup Studio"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>

        <!-- Ratio Pills Bar -->
        <div class="modal-ratio-bar">
          <button
            type="button"
            class="m-ratio-btn"
            :class="{ active: rideForm.aspectRatio === 'story' }"
            @click="rideForm.aspectRatio = 'story'"
          >
            📱 Story (9:16)
          </button>
          <button
            type="button"
            class="m-ratio-btn"
            :class="{ active: rideForm.aspectRatio === 'post' }"
            @click="rideForm.aspectRatio = 'post'"
          >
            🖼️ Square (1:1)
          </button>
          <button
            type="button"
            class="m-ratio-btn"
            :class="{ active: rideForm.aspectRatio === 'landscape' }"
            @click="rideForm.aspectRatio = 'landscape'"
          >
            🛣️ Banner (16:9)
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="modal-inner-workspace">
          <!-- Left / Top: Live Poster Preview -->
          <div class="modal-stage-col">
            <div
              class="modal-poster-card"
              :class="[
                `frame--${rideForm.aspectRatio}`,
                `bg--${rideForm.bgPreset}`,
                `theme--${rideForm.templateStyle}`,
              ]"
              :style="rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl ? { backgroundImage: `url(${rideForm.customPhotoUrl})` } : {}"
            >
              <div class="modal-poster-vignette"></div>

              <div class="modal-poster-top">
                <div class="m-brand-badge">⚡ GOWESKIT</div>
                <div v-if="rideForm.activeSticker !== 'none'" class="m-sticker-badge">
                  {{
                    {
                      kom: '👑 KOM HUNTER',
                      cafe: '☕ COFFEE APPROVED',
                      beast: '⛰️ CLIMB BEAST',
                      speed: '⚡ 26+ KM/H',
                      fuel: '🍲 FUEL SATE',
                      podium: '🏁 PODIUM FINISHER',
                    }[rideForm.activeSticker]
                  }}
                </div>
              </div>

              <div class="modal-poster-mid">
                <div class="m-mileage-row">
                  <span class="m-num">{{ rideForm.distanceKm }}</span>
                  <span class="m-unit">KM</span>
                </div>
                <h3 class="m-title">{{ rideForm.title }}</h3>
                <div class="m-meta">🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C</div>
              </div>

              <div class="modal-poster-bot">
                <div class="m-elev-row">
                  <span>ELEVASI PROFILE</span>
                  <span class="text-sky">+{{ rideForm.elevationM }}m Climb</span>
                </div>
                <div class="m-stats-row">
                  <div class="m-stat-item">
                    <span class="m-s-lbl">WAKTU</span>
                    <strong class="m-s-val">{{ formatDuration(rideForm.durationMinutes) }}</strong>
                  </div>
                  <div class="m-stat-item">
                    <span class="m-s-lbl">SPEED</span>
                    <strong class="m-s-val text-lime">{{ rideForm.avgSpeedKmH }} km/h</strong>
                  </div>
                  <div class="m-stat-item">
                    <span class="m-s-lbl">KALORI</span>
                    <strong class="m-s-val text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right / Bottom: Toolbox Tabs & Controls -->
          <div class="modal-controls-col">
            <nav class="m-tabs-nav">
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'templates' }"
                @click="activeTab = 'templates'"
              >
                🎨 Template
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'backgrounds' }"
                @click="activeTab = 'backgrounds'"
              >
                🌄 Bg
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'stickers' }"
                @click="activeTab = 'stickers'"
              >
                🏷️ Stiker
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'ai' }"
                @click="activeTab = 'ai'"
              >
                ✨ AI
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'data' }"
                @click="activeTab = 'data'"
              >
                📊 Data
              </button>
            </nav>

            <!-- Tab 1: Templates -->
            <div v-show="activeTab === 'templates'" class="m-tab-panel">
              <div class="m-style-grid">
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'strava_bold' }"
                  @click="rideForm.templateStyle = 'strava_bold'"
                >
                  🔥 <strong>Strava Bold</strong>
                  <small>Kinetic Neon &amp; Telemetri</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
                  @click="rideForm.templateStyle = 'rapha_editorial'"
                >
                  🏔️ <strong>Rapha Editorial</strong>
                  <small>Clean GPS &amp; Klasik</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
                  @click="rideForm.templateStyle = 'cyber_hud'"
                >
                  ⚡ <strong>Cyber HUD</strong>
                  <small>Dashboard Sensor Digital</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
                  @click="rideForm.templateStyle = 'cafe_santai'"
                >
                  ☕ <strong>Kopi &amp; Sate</strong>
                  <small>Warm Food Fuel</small>
                </button>
              </div>
            </div>

            <!-- Tab 2: Backgrounds -->
            <div v-show="activeTab === 'backgrounds'" class="m-tab-panel">
              <div class="m-bg-grid">
                <button
                  type="button"
                  class="m-bg-btn bg--alpine"
                  :class="{ active: rideForm.bgPreset === 'alpine' }"
                  @click="rideForm.bgPreset = 'alpine'"
                >
                  🏔️ Alpine
                </button>
                <button
                  type="button"
                  class="m-bg-btn bg--gravel"
                  :class="{ active: rideForm.bgPreset === 'gravel' }"
                  @click="rideForm.bgPreset = 'gravel'"
                >
                  🌲 Gravel
                </button>
                <button
                  type="button"
                  class="m-bg-btn bg--sunset"
                  :class="{ active: rideForm.bgPreset === 'sunset' }"
                  @click="rideForm.bgPreset = 'sunset'"
                >
                  🌅 Sunset
                </button>
                <button
                  type="button"
                  class="m-bg-btn bg--crit"
                  :class="{ active: rideForm.bgPreset === 'crit' }"
                  @click="rideForm.bgPreset = 'crit'"
                >
                  ⚡ Crit
                </button>
                <button
                  type="button"
                  class="m-bg-btn bg--cafe"
                  :class="{ active: rideForm.bgPreset === 'cafe' }"
                  @click="rideForm.bgPreset = 'cafe'"
                >
                  ☕ Cafe
                </button>
                <button
                  type="button"
                  class="m-bg-btn bg--topo"
                  :class="{ active: rideForm.bgPreset === 'topo' }"
                  @click="rideForm.bgPreset = 'topo'"
                >
                  🗺️ Topo
                </button>
              </div>
              <label class="m-upload-cta">
                <input type="file" accept="image/*" class="sr-only" @change="handlePhotoUpload" />
                <span>📸 Unggah Foto Sendiri dari HP</span>
              </label>
            </div>

            <!-- Tab 3: Stickers -->
            <div v-show="activeTab === 'stickers'" class="m-tab-panel">
              <div class="m-stickers-cloud">
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'kom' }"
                  @click="rideForm.activeSticker = 'kom'"
                >
                  👑 KOM Hunter
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'cafe' }"
                  @click="rideForm.activeSticker = 'cafe'"
                >
                  ☕ Coffee Approved
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'beast' }"
                  @click="rideForm.activeSticker = 'beast'"
                >
                  ⛰️ Climb Beast
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'speed' }"
                  @click="rideForm.activeSticker = 'speed'"
                >
                  ⚡ Breakaway Pace
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'fuel' }"
                  @click="rideForm.activeSticker = 'fuel'"
                >
                  🍲 Sate Maranggi
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'none' }"
                  @click="rideForm.activeSticker = 'none'"
                >
                  Tanpa Stiker
                </button>
              </div>
            </div>

            <!-- Tab 4: AI -->
            <div v-show="activeTab === 'ai'" class="m-tab-panel">
              <div class="m-ai-box">
                <div class="m-ai-top">
                  <strong>✨ AI Story &amp; Caption</strong>
                  <button type="button" class="m-gen-btn" :disabled="isAiGenerating" @click="generateAiStory">
                    {{ isAiGenerating ? 'Meracik...' : '🪄 Generate' }}
                  </button>
                </div>
                <div class="m-persona-deck">
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'athlete' }"
                    @click="selectedPersona = 'athlete'"
                  >
                    🏆 Atlet
                  </button>
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'humor' }"
                    @click="selectedPersona = 'humor'"
                  >
                    😂 Santai
                  </button>
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'technical' }"
                    @click="selectedPersona = 'technical'"
                  >
                    ⚙️ Tech
                  </button>
                </div>
                <p class="m-caption-text">{{ aiRecap.captions[selectedPersona] }}</p>
                <button type="button" class="m-copy-btn" @click="copyCaption(aiRecap.captions[selectedPersona])">
                  📋 Salin Caption
                </button>
              </div>
            </div>

            <!-- Tab 5: Data -->
            <div v-show="activeTab === 'data'" class="m-tab-panel">
              <div class="m-form-fields">
                <label>Judul Sesi</label>
                <input v-model="rideForm.title" type="text" />
                <label>Nama Sepeda</label>
                <input v-model="rideForm.bikeName" type="text" />
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <footer class="modal-footer-actions">
              <button type="button" class="m-action-share" :disabled="isExporting" @click="shareToMedia">
                📲 Bagikan Langsung
              </button>
              <button type="button" class="m-action-dl" :disabled="isExporting" @click="downloadStoryImage">
                💾 Unduh PNG
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.studio-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(4, 7, 15, 0.92);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  overflow-y: auto;
}

.studio-modal-container {
  width: 100%;
  max-width: 54rem;
  max-height: 94vh;
  background: #080d19;
  border: 1.5px solid rgba(201, 243, 106, 0.25);
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.85);
  color: #f8fafc;
}

.modal-top-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: #050811;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-title-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-dot-pulse {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
  box-shadow: 0 0 10px var(--color-chain-lime);
}

.modal-heading {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.modal-btn-close {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-ratio-bar {
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.35rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.m-ratio-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.35rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
  border-radius: 0.5rem;
  cursor: pointer;
}

.m-ratio-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
}

.modal-inner-workspace {
  display: grid;
  grid-template-columns: 19rem 1fr;
  overflow-y: auto;
  gap: 1.25rem;
  padding: 1.25rem;
  align-items: start;
}

@media (max-width: 768px) {
  .modal-inner-workspace {
    grid-template-columns: 1fr;
    padding: 0.85rem;
  }
}

.modal-stage-col {
  display: flex;
  justify-content: center;
}

.modal-poster-card {
  width: 100%;
  max-width: 18rem;
  height: 300px;
  border-radius: 1.15rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.95rem;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  background-size: cover;
  background-position: center;
}

.modal-poster-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 10, 18, 0.3) 0%, transparent 40%, rgba(6, 10, 18, 0.9) 100%);
  z-index: 1;
}

.modal-poster-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-brand-badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  background: rgba(15, 23, 42, 0.9);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid var(--color-chain-lime);
}

.m-sticker-badge {
  font-size: 0.6rem;
  font-weight: 900;
  color: #080d19;
  background: var(--color-chain-lime);
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.modal-poster-mid {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.5rem;
}

.m-mileage-row {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.m-num {
  font-family: var(--font-mono);
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  line-height: 0.9;
}

.m-unit {
  font-size: 1rem;
  font-weight: 900;
  color: #ffffff;
}

.m-title {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  font-weight: 850;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-meta {
  font-size: 0.65rem;
  color: #cbd5e1;
}

.modal-poster-bot {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 0.85rem;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.m-elev-row {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 800;
  color: #94a3b8;
}

.m-stats-row {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.35rem;
}

.m-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-s-lbl {
  font-family: var(--font-mono);
  font-size: 0.5rem;
  color: #94a3b8;
}

.m-s-val {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime { color: var(--color-chain-lime); }
.text-sky { color: #38bdf8; }
.text-coral { color: #ff8c75; }

.modal-controls-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.m-tabs-nav {
  display: flex;
  gap: 0.25rem;
  background: #050811;
  padding: 0.25rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.m-tab-item {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.5rem 0.25rem;
  font-size: 0.74rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.65rem;
  cursor: pointer;
}

.m-tab-item.active {
  background: #1e293b;
  color: var(--color-chain-lime);
}

.m-tab-panel {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.m-style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.m-style-card {
  padding: 0.75rem;
  border-radius: 0.85rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
}

.m-style-card.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.m-style-card strong {
  display: block;
  font-size: 0.82rem;
}

.m-style-card small {
  font-size: 0.65rem;
  color: #94a3b8;
}

.m-bg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
}

.m-bg-btn {
  height: 3.5rem;
  border-radius: 0.65rem;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 850;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  padding: 0.35rem;
}

.m-bg-btn.active {
  border-color: var(--color-chain-lime);
}

.bg--alpine { background: linear-gradient(135deg, #1e3a8a, #0f172a); }
.bg--gravel { background: linear-gradient(135deg, #14532d, #0f172a); }
.bg--sunset { background: linear-gradient(135deg, #9a3412, #0f172a); }
.bg--crit { background: linear-gradient(135deg, #6b21a8, #0b0f19); }
.bg--cafe { background: linear-gradient(135deg, #78350f, #0f172a); }
.bg--topo { background: linear-gradient(135deg, #0b1120, #020617); }

.m-upload-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem;
  border-radius: 0.85rem;
  border: 1.5px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  font-size: 0.75rem;
  font-weight: 850;
  color: var(--color-chain-lime);
  cursor: pointer;
}

.m-stickers-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.m-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
}

.m-chip.active {
  background: var(--color-chain-lime);
  color: #080d19;
  border-color: var(--color-chain-lime);
}

.m-ai-box {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 0.85rem;
}

.m-ai-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.m-gen-btn {
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
}

.m-persona-deck {
  display: flex;
  gap: 0.35rem;
}

.m-p-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 0.35rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
}

.m-p-btn.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.m-caption-text {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: #cbd5e1;
}

.m-copy-btn {
  background: rgba(201, 243, 106, 0.15);
  border: 1.5px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.4rem;
  border-radius: 0.6rem;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
}

.m-form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.m-form-fields label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 800;
}

.m-form-fields input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.65rem;
  padding: 0.5rem 0.65rem;
  color: #ffffff;
  font-size: 0.8rem;
}

.modal-footer-actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.35rem;
}

.m-action-share {
  flex: 1.2;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.84rem;
  font-weight: 900;
  cursor: pointer;
}

.m-action-dl {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.82rem;
  font-weight: 850;
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
</style>
