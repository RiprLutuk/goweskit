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
  theme: 'strava_bold' as 'strava_bold' | 'rapha_editorial' | 'cyber_hud' | 'cafe_santai',
  aspectRatio: 'story' as 'story' | 'post' | 'landscape',
  activeSticker: 'kom' as 'kom' | 'cafe' | 'beast' | 'speed' | 'fuel' | 'finished' | 'none',
  bgPreset: 'topo' as 'topo' | 'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'custom',
  customPhotoUrl: '',
});

// Selected Persona for Social Media Caption
const selectedPersona = ref<'athlete' | 'humor' | 'technical'>('athlete');

// AI Agentic Storyteller State
const isAiGenerating = ref(false);
const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight: 'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  foodEquivalency: '1 mangkok Bubur Ayam Spesial Komplit Telur Setengah Matang 🍲',
  climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
  captions: {
    athlete: '🎯 45.8 km · +580m Elevasi · Avg 26.2 km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama Polygon Siskiu T7. Fokus recovery setelah membakar ~980 kcal. #GowesKit #RideFlex #CyclingLife',
    humor: '🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus 45.8 km dengan tanjakan 580m! Kaki auto bergetar pas pesen Bubur Ayam Komplit. Kopi dapet, konten dapet, flexing jalan! 😂☕ #GowesSantai #NoWacana',
    technical: '⚙️ Rute: Morning Gravel Loop (45.8 km). Setup drivetrain pada Polygon Siskiu T7 bekerja mulus di gradien Cat 2 Mountain Pass. Kecepatan rata-rata 26.2 km/h dengan efisiensi putaran crank optimal. Suhu 25°C. #BikeSpecs #GowesKit',
  },
  mechanicTip: '💡 Saran AI Mekanik: Setelah elevasi +580m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.',
  hashtags: ['#GowesKit', '#RideFlex', '#CyclingIndonesia', '#KOMHunter', '#GowesPagi'],
});

const isExporting = ref(false);

// Pure Vector SVG Topo background for reliable offline loading
const TOPO_SVG_DATA =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="800" height="1200" fill="%230b1120"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%231e293b" stop-opacity="0.8"/><stop offset="100%25" stop-color="%230f172a" stop-opacity="0.95"/></linearGradient></defs><rect width="800" height="1200" fill="url(%23g1)"/><path d="M0 200 C 200 150, 400 350, 800 180" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 350 C 250 280, 500 450, 800 320" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 500 C 300 420, 600 600, 800 480" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 650 C 200 580, 500 780, 800 620" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 800 C 350 720, 450 950, 800 800" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 950 C 220 880, 550 1100, 800 950" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M 120 1080 Q 280 880, 400 620 T 680 180" stroke="%23c9f36a" stroke-width="6" stroke-dasharray="10 8" fill="none"/><circle cx="120" cy="1080" r="12" fill="%2338bdf8"/><circle cx="680" cy="180" r="14" fill="%23c9f36a"/><circle cx="400" cy="620" r="8" fill="%23fde047"/></svg>';

// Verified High-Res Curated Cycling Photography
const PRESET_BACKGROUNDS = {
  topo: TOPO_SVG_DATA,
  alpine: 'https://images.unsplash.com/photo-1502744688674-c619d3864003?auto=format&fit=crop&w=1200&q=85',
  gravel: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
  sunset: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1200&q=85',
  crit: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85',
};

const currentBackgroundSrc = computed(() => {
  if (rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl) {
    return rideForm.customPhotoUrl;
  }
  return (
    PRESET_BACKGROUNDS[rideForm.bgPreset as keyof typeof PRESET_BACKGROUNDS] ||
    PRESET_BACKGROUNDS.topo
  );
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
      toast.success('Foto Berhasil Diunggah!', 'Foto gowes Anda kini menjadi latar belakang poster.');
    }
  };
  reader.readAsDataURL(file);
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

// 🤖 Agentic AI Generator (calls Backend API /api/v1/ride-flex/generate-story with fallback)
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
    toast.success('✨ Cerita AI Dihasilkan!', 'Judul, analisis kalori, dan 3 persona caption siap digunakan.');
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
      highlight: `Kamu membakar ~${rideForm.caloriesKcal} kalori dan menaklukkan elevasi +${elev}m dengan kecepatan rata-rata ${speed} km/jam!`,
      foodEquivalency: '1 porsi Pisang Goreng Keju & Es Kopi Susu Aren 🍌☕',
      climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
      captions: {
        athlete: `🎯 ${distance}km · +${elev}m elevation gain · ${speed} km/h avg pace. Building endurance and power output with ${rideForm.bikeName}. #GowesKit #RideFlex`,
        humor: `🚴 Katanya gowes tipis-tipis cari sarapan, nyatanya disiksa tanjakan +${elev}m! Kaki auto getar pas pesen kopi, tapi flexing jalan terus! 😂☕ #GowesSantai`,
        technical: `⚙️ Rute: ${distance}km (+${elev}m). Setup drivetrain pada ${rideForm.bikeName} bekerja mulus di gradien menanjak. Kecepatan rata-rata ${speed} km/h. #BikeSpecs`,
      },
      mechanicTip: '💡 Saran AI Mekanik: Setelah tanjakan curam, periksa kekencangan baut crank dan keausan rantai sebelum gowes berikutnya.',
      hashtags: ['#GowesKit', '#RideFlex', '#CyclingLife', '#KOMHunter'],
    };
    toast.info('Mode Offline Heuristic', 'AI recap dihasilkan dari engine lokal.');
  } finally {
    isAiGenerating.value = false;
  }
}

async function copyCaption(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Caption Disalin!', 'Siap di-paste ke Instagram, Strava, atau WhatsApp.');
  } catch {
    toast.error('Gagal menyalin', 'Salin teks secara manual.');
  }
}

// 🎨 High-Definition Canvas Render Engine (1080x1920 Story or 1080x1080 Post)
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

  // 1. Draw Background Image
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentBackgroundSrc.value;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
    });

    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  } catch {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Cinematic Vignette Gradient Overlay
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(11, 17, 32, 0.75)');
  gradient.addColorStop(0.35, 'rgba(11, 17, 32, 0.25)');
  gradient.addColorStop(0.65, 'rgba(11, 17, 32, 0.7)');
  gradient.addColorStop(1, 'rgba(11, 17, 32, 0.96)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Top Branding Pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, isStory ? 90 : 60, 360, 52, 26);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('⚡ GOWESKIT RIDE PASS', 95, isStory ? 126 : 96);

  // 4. Sticker Badge if selected
  if (rideForm.activeSticker !== 'none') {
    const stickerText = {
      kom: '👑 KOM HUNTER',
      cafe: '☕ COFFEE RIDE APPROVED',
      beast: '⛰️ CLIMB BEAST',
      speed: '⚡ 26+ KM/H PACE',
      fuel: '🍲 980 KCAL FUEL',
      finished: '✓ 100% FINISHED',
    }[rideForm.activeSticker];

    if (stickerText) {
      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(canvas.width - 430, isStory ? 90 : 60, 360, 52, 26);
      ctx.fill();

      ctx.fillStyle = '#17202A';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(stickerText, canvas.width - 405, isStory ? 126 : 96);
    }
  }

  // 5. Main Hero Distance Callout
  const heroY = isStory ? 1000 : (isLandscape ? 400 : 460);

  // Large Prominent Distance
  ctx.fillStyle = '#C9F36A';
  ctx.font = '900 130px monospace';
  ctx.fillText(`${rideForm.distanceKm}`, 70, heroY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 50px sans-serif';
  ctx.fillText('KM', 70 + ctx.measureText(`${rideForm.distanceKm}`).width + 25, heroY - 45);

  // Ride Title & Subtitle
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 65);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, 70, heroY + 110);

  // 6. Stats Grid Card
  const cardY = heroY + 145;
  const cardH = isStory ? 480 : (isLandscape ? 340 : 360);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(70, cardY, canvas.width - 140, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // Draw Elevation Sparkline inside stats card
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(110, cardY + 70);
  ctx.quadraticCurveTo(300, cardY + 20, 500, cardY + 65);
  ctx.quadraticCurveTo(700, cardY + 15, canvas.width - 110, cardY + 45);
  ctx.stroke();

  // Metrics Rows
  const cellW = (canvas.width - 140) / 2;
  const metrics = [
    { label: 'ELEVASI TANJAKAN', val: `+${rideForm.elevationM} m`, color: '#38BDF8' },
    { label: 'WAKTU TEMPUH', val: formatDuration(rideForm.durationMinutes), color: '#FFFFFF' },
    { label: 'RATA-RATA SPEED', val: `${rideForm.avgSpeedKmH} km/h`, color: '#FDE047' },
    { label: 'KALORI TERBAKAR', val: `~${rideForm.caloriesKcal} kcal`, color: '#FF8C75' },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 110 + col * (cellW - 20);
    const y = cardY + 130 + row * (isStory ? 170 : 115);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(m.label, x, y);

    ctx.fillStyle = m.color;
    ctx.font = '900 52px monospace';
    ctx.fillText(m.val, x, y + 55);
  });

  // 7. Watermark Footer
  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID', 80, canvas.height - 40);

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
            <span id="studio-title">RIDE FLEX STUDIO &amp; AI STORYTELLER</span>
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
          <!-- LEFT: LIVE HIGH-FLEX POSTER PREVIEW -->
          <div class="poster-preview-pane">
            <div
              class="live-poster"
              :class="[
                `live-poster--${rideForm.aspectRatio}`,
                `live-poster-theme--${rideForm.theme}`,
              ]"
              :style="{ backgroundImage: `url(${currentBackgroundSrc})` }"
            >
              <!-- Top Vignette & Lighting -->
              <div class="live-poster__overlay"></div>

              <!-- Top Bar & Stickers -->
              <div class="poster-top-bar">
                <div class="poster-brand-chip">
                  <span class="brand-bolt">⚡</span>
                  <span>GOWESKIT</span>
                </div>
                <span
                  v-if="rideForm.activeSticker !== 'none'"
                  class="poster-sticker-tag"
                >
                  {{
                    {
                      kom: '👑 KOM HUNTER',
                      cafe: '☕ COFFEE RIDE',
                      beast: '⛰️ CLIMB BEAST',
                      speed: '⚡ 26+ KM/H',
                      fuel: '🍲 980 KCAL FUEL',
                      finished: '✓ 100% FINISHED',
                    }[rideForm.activeSticker]
                  }}
                </span>
              </div>

              <!-- Mid Hero Stat: Giant Kinetic Number -->
              <div class="poster-hero-metric">
                <div class="hero-distance-line">
                  <span class="hero-num">{{ rideForm.distanceKm }}</span>
                  <span class="hero-unit">KM</span>
                </div>
                <h3 class="poster-headline">{{ rideForm.title }}</h3>
                <div class="poster-meta-pill">
                  <span>🚴 {{ rideForm.bikeName }}</span>
                  <span>·</span>
                  <span>{{ rideForm.temperatureC }}°C Cerah</span>
                </div>
              </div>

              <!-- Bottom Telemetry Glass Card -->
              <div class="poster-telemetry-card">
                <!-- Elevation Mini Sparkline -->
                <div class="poster-elevation-spark">
                  <div class="spark-topline">
                    <span>ELEVASI PROFILE</span>
                    <strong class="text-sky">+{{ rideForm.elevationM }}m Climb</strong>
                  </div>
                  <svg viewBox="0 0 300 36" class="sparkline-svg" aria-hidden="true">
                    <path
                      d="M0 32 Q 60 30, 120 16 T 220 8 L 300 4"
                      fill="none"
                      stroke="#38BDF8"
                      stroke-width="3"
                      stroke-linecap="round"
                    />
                    <circle cx="0" cy="32" r="4" fill="#38BDF8" />
                    <circle cx="300" cy="4" r="5" fill="#C9F36A" />
                  </svg>
                </div>

                <!-- 3 Compact Key Metrics -->
                <div class="poster-metrics-strip">
                  <div class="stat-cell">
                    <span class="stat-label">WAKTU</span>
                    <strong class="stat-value">{{ formatDuration(rideForm.durationMinutes) }}</strong>
                  </div>
                  <div class="stat-cell-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-label">AVG SPEED</span>
                    <strong class="stat-value text-lime">{{ rideForm.avgSpeedKmH }} km/h</strong>
                  </div>
                  <div class="stat-cell-divider"></div>
                  <div class="stat-cell">
                    <span class="stat-label">KALORI</span>
                    <strong class="stat-value text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
                  </div>
                </div>
              </div>

              <!-- Verified Footer -->
              <div class="poster-verified-footer">
                <span>⚡ VERIFIED BY GOWESKIT ENGINE</span>
              </div>
            </div>

            <!-- Quick Format & Ratio Switcher Bar -->
            <div class="poster-ratio-bar">
              <button
                type="button"
                class="ratio-btn"
                :class="{ active: rideForm.aspectRatio === 'story' }"
                @click="rideForm.aspectRatio = 'story'"
              >
                📱 Story (9:16)
              </button>
              <button
                type="button"
                class="ratio-btn"
                :class="{ active: rideForm.aspectRatio === 'post' }"
                @click="rideForm.aspectRatio = 'post'"
              >
                🖼️ Square (1:1)
              </button>
              <button
                type="button"
                class="ratio-btn"
                :class="{ active: rideForm.aspectRatio === 'landscape' }"
                @click="rideForm.aspectRatio = 'landscape'"
              >
                🛣️ Banner (16:9)
              </button>
            </div>
          </div>

          <!-- RIGHT: CREATIVE CONTROLS & AGENTIC AI STUDIO -->
          <div class="studio-controls-pane">
            <!-- 🤖 1. AGENTIC AI STORYTELLER & CAPTION STUDIO -->
            <div class="ai-coach-card">
              <div class="ai-card__header">
                <div class="ai-header-left">
                  <span class="ai-spark-icon">✨</span>
                  <div>
                    <strong>Agentic AI Ride Coach &amp; Storyteller</strong>
                    <small>Generate narasi sinematik &amp; caption flexing otomatis</small>
                  </div>
                </div>
                <button
                  type="button"
                  class="ai-generate-btn"
                  :disabled="isAiGenerating"
                  @click="generateAiStory"
                >
                  <span v-if="isAiGenerating" class="spin-icon">⏳</span>
                  <span v-else>🪄</span>
                  <span>{{ isAiGenerating ? 'Meracik AI...' : 'Generate AI' }}</span>
                </button>
              </div>

              <!-- Culinary & Effort Equivalency Callout -->
              <div class="ai-food-pill">
                <span class="food-badge">🍲 FUEL EQUIVALENCY</span>
                <p>{{ aiRecap.foodEquivalency }}</p>
              </div>

              <!-- Persona Captions Tab Switcher -->
              <div class="persona-tab-row">
                <button
                  type="button"
                  class="persona-tab"
                  :class="{ active: selectedPersona === 'athlete' }"
                  @click="selectedPersona = 'athlete'"
                >
                  🏆 Atlet / Power
                </button>
                <button
                  type="button"
                  class="persona-tab"
                  :class="{ active: selectedPersona === 'humor' }"
                  @click="selectedPersona = 'humor'"
                >
                  😂 Santai &amp; Ngopi
                </button>
                <button
                  type="button"
                  class="persona-tab"
                  :class="{ active: selectedPersona === 'technical' }"
                  @click="selectedPersona = 'technical'"
                >
                  ⚙️ Tech Geek
                </button>
              </div>

              <!-- Live Caption Display Box -->
              <div class="ai-caption-display-box">
                <p class="caption-content">{{ aiRecap.captions[selectedPersona] }}</p>
                <div class="caption-action-bar">
                  <span class="caption-count">{{ aiRecap.captions[selectedPersona].length }} Karakter</span>
                  <button
                    type="button"
                    class="copy-caption-btn"
                    @click="copyCaption(aiRecap.captions[selectedPersona])"
                  >
                    📋 Salin Caption &amp; Hashtag
                  </button>
                </div>
              </div>

              <!-- Preventive AI Mechanic Tip -->
              <div class="ai-mechanic-box">
                <span>{{ aiRecap.mechanicTip }}</span>
              </div>
            </div>

            <!-- 🎨 2. BACKGROUND PHOTO PRESETS & UPLOAD -->
            <div class="studio-section-card">
              <span class="control-section-title">🖼️ Pilihan Background Estetis</span>
              <div class="bg-preset-grid">
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'topo' }"
                  @click="rideForm.bgPreset = 'topo'"
                >
                  <span class="thumb-emoji">🗺️</span>
                  <span>Topo Neon</span>
                </button>
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'alpine' }"
                  @click="rideForm.bgPreset = 'alpine'"
                >
                  <span class="thumb-emoji">🏔️</span>
                  <span>Alpine Pass</span>
                </button>
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'gravel' }"
                  @click="rideForm.bgPreset = 'gravel'"
                >
                  <span class="thumb-emoji">🌲</span>
                  <span>Gravel Pine</span>
                </button>
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'sunset' }"
                  @click="rideForm.bgPreset = 'sunset'"
                >
                  <span class="thumb-emoji">🌅</span>
                  <span>Sunset Coast</span>
                </button>
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'crit' }"
                  @click="rideForm.bgPreset = 'crit'"
                >
                  <span class="thumb-emoji">⚡</span>
                  <span>Speed Crit</span>
                </button>
                <button
                  type="button"
                  class="preset-thumb-btn"
                  :class="{ active: rideForm.bgPreset === 'cafe' }"
                  @click="rideForm.bgPreset = 'cafe'"
                >
                  <span class="thumb-emoji">☕</span>
                  <span>Coffee Ride</span>
                </button>
              </div>

              <!-- Upload Custom Ride Photo -->
              <label class="custom-photo-uploader">
                <input
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="handlePhotoUpload"
                />
                <span class="upload-icon">📸</span>
                <span>Unggah Foto Sendiri dari Galeri / Kamera</span>
              </label>
            </div>

            <!-- 🏷️ 3. STICKER SELECTION -->
            <div class="studio-section-card">
              <span class="control-section-title">🏷️ Stiker Flexing</span>
              <div class="stickers-row">
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'kom' }"
                  @click="rideForm.activeSticker = 'kom'"
                >
                  👑 KOM Hunter
                </button>
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'cafe' }"
                  @click="rideForm.activeSticker = 'cafe'"
                >
                  ☕ Coffee Approved
                </button>
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'beast' }"
                  @click="rideForm.activeSticker = 'beast'"
                >
                  ⛰️ Climb Beast
                </button>
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'speed' }"
                  @click="rideForm.activeSticker = 'speed'"
                >
                  ⚡ Breakaway Pace
                </button>
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'fuel' }"
                  @click="rideForm.activeSticker = 'fuel'"
                >
                  🍲 980 kcal Fuel
                </button>
                <button
                  type="button"
                  class="sticker-choice-chip"
                  :class="{ active: rideForm.activeSticker === 'none' }"
                  @click="rideForm.activeSticker = 'none'"
                >
                  Tanpa Stiker
                </button>
              </div>
            </div>

            <!-- 📊 4. EDIT TELEMETRY METRICS -->
            <div class="studio-section-card">
              <span class="control-section-title">📊 Edit Data Telemetri</span>
              <div class="fields-grid">
                <div class="input-item">
                  <label>Judul Sesi Gowes</label>
                  <input v-model="rideForm.title" type="text" />
                </div>
                <div class="input-item">
                  <label>Nama Sepeda</label>
                  <input v-model="rideForm.bikeName" type="text" />
                </div>
                <div class="input-item">
                  <label>Jarak (km)</label>
                  <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
                </div>
                <div class="input-item">
                  <label>Elevasi (m)</label>
                  <input v-model.number="rideForm.elevationM" type="number" />
                </div>
                <div class="input-item">
                  <label>Durasi (Menit)</label>
                  <input v-model.number="rideForm.durationMinutes" type="number" />
                </div>
                <div class="input-item">
                  <label>Suhu Udara (°C)</label>
                  <input v-model.number="rideForm.temperatureC" type="number" />
                </div>
              </div>
            </div>

            <!-- 🚀 5. FINAL ACTION BUTTONS -->
            <div class="studio-action-row">
              <button
                type="button"
                class="main-share-btn"
                :disabled="isExporting"
                @click="shareToMedia"
              >
                <span class="btn-icon">📲</span>
                <span>{{ isExporting ? 'Merender HD...' : 'Bagikan Langsung' }}</span>
              </button>
              <button
                type="button"
                class="download-png-btn"
                :disabled="isExporting"
                @click="downloadStoryImage"
              >
                <span class="btn-icon">💾</span>
                <span>Unduh Gambar HD (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.studio-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(11, 17, 32, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

/* Modal Card */
.studio-modal-card {
  width: 100%;
  max-width: 58rem;
  max-height: 92vh;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  color: #f8fafc;
}

/* Header */
.studio-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b1120;
}

.studio-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: 0.04em;
}

.studio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
  box-shadow: 0 0 10px var(--color-chain-lime);
}

.studio-close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #94a3b8;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 120ms ease;
}

.studio-close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

/* Layout Split */
.studio-body-layout {
  display: grid;
  grid-template-columns: 22rem 1fr;
  overflow-y: auto;
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (max-width: 820px) {
  .studio-body-layout {
    grid-template-columns: 1fr;
  }
}

/* LEFT PREVIEW PANE */
.poster-preview-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* LIVE POSTER CONTAINER */
.live-poster {
  width: 100%;
  max-width: 20rem;
  aspect-ratio: 9 / 16;
  border-radius: 1.25rem;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.15rem;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  transition: all 200ms ease;
}

.live-poster--post {
  aspect-ratio: 1 / 1;
}

.live-poster--landscape {
  aspect-ratio: 16 / 9;
}

.live-poster__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 17, 32, 0.75) 0%,
    rgba(11, 17, 32, 0.2) 35%,
    rgba(11, 17, 32, 0.75) 70%,
    rgba(11, 17, 32, 0.96) 100%
  );
  z-index: 1;
}

/* Top Bar in Poster */
.poster-top-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.poster-brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid var(--color-chain-lime);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.poster-sticker-tag {
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: #0f172a;
  font-size: 0.62rem;
  font-weight: 900;
  box-shadow: 0 2px 10px rgba(201, 243, 106, 0.3);
}

/* Hero Distance Callout in Poster */
.poster-hero-metric {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero-distance-line {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  line-height: 1;
}

.hero-num {
  font-family: var(--font-mono);
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: -0.04em;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
}

.hero-unit {
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffffff;
}

.poster-headline {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poster-meta-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: #cbd5e1;
}

/* Telemetry Glass Card in Poster */
.poster-telemetry-card {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(201, 243, 106, 0.35);
  border-radius: 0.95rem;
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(8px);
}

.poster-elevation-spark {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.spark-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 800;
  color: #94a3b8;
}

.sparkline-svg {
  width: 100%;
  height: 1.35rem;
}

.poster-metrics-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.4rem;
}

.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-cell-divider {
  width: 1px;
  height: 1.4rem;
  background: rgba(255, 255, 255, 0.1);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  font-weight: 800;
  color: #94a3b8;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime {
  color: var(--color-chain-lime);
}

.text-sky {
  color: #38bdf8;
}

.text-coral {
  color: #ff8c75;
}

/* Verified Footer */
.poster-verified-footer {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 800;
  color: rgba(201, 243, 106, 0.8);
  letter-spacing: 0.02em;
  margin-top: 0.25rem;
}

/* Ratio Switcher Bar */
.poster-ratio-bar {
  display: flex;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem;
  border-radius: 0.75rem;
  width: 100%;
}

.ratio-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.4rem 0.2rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 120ms ease;
}

.ratio-btn.active {
  background: #1e293b;
  color: #f8fafc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* RIGHT CONTROLS PANE */
.studio-controls-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* AI COACH CARD */
.ai-coach-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 1.15rem;
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.ai-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-spark-icon {
  font-size: 1.4rem;
}

.ai-header-left strong {
  display: block;
  font-size: 0.92rem;
  color: #f8fafc;
}

.ai-header-left small {
  font-size: 0.72rem;
  color: #94a3b8;
}

.ai-generate-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(201, 243, 106, 0.25);
  transition: all 120ms ease;
  white-space: nowrap;
}

.ai-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(201, 243, 106, 0.4);
}

.ai-generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  display: inline-block;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

/* Culinary & Food Fuel Equivalency */
.ai-food-pill {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #ff8c75;
}

.food-badge {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 900;
  color: #ff8c75;
}

.ai-food-pill p {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 750;
  color: #f1f5f9;
}

/* Persona Tabs */
.persona-tab-row {
  display: flex;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.25);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.persona-tab {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.45rem 0.3rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.persona-tab.active {
  background: #334155;
  color: #ffffff;
}

/* Live Caption Display Box */
.ai-caption-display-box {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.caption-content {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.caption-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.5rem;
}

.caption-count {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: #64748b;
}

.copy-caption-btn {
  background: rgba(201, 243, 106, 0.15);
  border: 1px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.72rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.copy-caption-btn:hover {
  background: var(--color-chain-lime);
  color: #0f172a;
}

.ai-mechanic-box {
  padding: 0.55rem 0.75rem;
  border-radius: 0.65rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  font-size: 0.72rem;
  color: #bae6fd;
}

/* SECTION CARDS */
.studio-section-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.15rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-section-title {
  font-size: 0.8rem;
  font-weight: 850;
  color: #e2e8f0;
}

/* BG Preset Grid */
.bg-preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.45rem;
}

.preset-thumb-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 0.25rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.preset-thumb-btn.active {
  border-color: var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.1);
  color: #ffffff;
}

.thumb-emoji {
  font-size: 1.1rem;
}

.custom-photo-uploader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem;
  border-radius: 0.75rem;
  border: 1.5px dashed rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.03);
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.custom-photo-uploader:hover {
  border-color: var(--color-chain-lime);
  color: var(--color-chain-lime);
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

/* Stickers Row */
.stickers-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.sticker-choice-chip {
  padding: 0.4rem 0.7rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.sticker-choice-chip.active {
  background: var(--color-chain-lime);
  border-color: var(--color-chain-lime);
  color: #0f172a;
}

/* Fields Grid */
.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.input-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-item label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #94a3b8;
}

.input-item input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.65rem;
  padding: 0.45rem 0.65rem;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 750;
}

.input-item input:focus {
  outline: none;
  border-color: var(--color-chain-lime);
}

/* Action Buttons */
.studio-action-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.main-share-btn {
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.88rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
}

.main-share-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(201, 243, 106, 0.5);
}

.download-png-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.download-png-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}
</style>
