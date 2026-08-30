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

// Navigation Tabs in Studio
const activeTab = ref<'templates' | 'ai' | 'data'>('templates');

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
  templateStyle: 'strava_bold' as 'strava_bold' | 'rapha_editorial' | 'cyber_hud' | 'cafe_santai' | 'grand_tour',
  aspectRatio: 'story' as 'story' | 'post' | 'landscape',
  activeSticker: 'kom' as 'kom' | 'cafe' | 'beast' | 'speed' | 'fuel' | 'podium' | 'none',
  bgPreset: 'alpine' as 'alpine' | 'gravel' | 'sunset' | 'crit' | 'topo' | 'cafe' | 'custom',
  customPhotoUrl: '',
});

// Selected Persona for Social Media Caption
const selectedPersona = ref<'athlete' | 'humor' | 'technical'>('athlete');

// AI Agentic Storyteller State
const isAiGenerating = ref(false);
const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight: 'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  foodEquivalency: '1 porsi Sate Maranggi + Es Kelapa Muda 🍢🥥',
  climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
  captions: {
    athlete: '🎯 45.8 km · +580m Elevasi · Avg 26.2 km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama Polygon Siskiu T7. Fokus recovery setelah membakar ~980 kcal. #GowesKit #RideFlex #CyclingLife #NoExcuses',
    humor: '🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus 45.8 km dengan tanjakan 580m! Kaki auto getar pas pesen Sate Maranggi. Kopi dapet, konten dapet, flexing jalan! 😂☕ #GowesSantai #NoWacana #GowesKit',
    technical: '⚙️ Rute: Morning Gravel Loop (45.8 km). Setup drivetrain pada Polygon Siskiu T7 bekerja mulus di gradien Cat 2 Mountain Pass. Kecepatan rata-rata 26.2 km/h dengan efisiensi putaran crank optimal. Suhu 25°C. #BikeSpecs #GowesKit',
  },
  mechanicTip: '💡 Saran AI Mekanik: Setelah elevasi +580m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.',
  hashtags: ['#GowesKit', '#RideFlex', '#CyclingIndonesia', '#KOMHunter', '#GowesPagi'],
});

const isExporting = ref(false);

// Verified High-Res Curated Cycling Photography
const PRESET_BACKGROUNDS = {
  alpine: 'https://images.unsplash.com/photo-1502744688674-c619d3864003?auto=format&fit=crop&w=1200&q=85',
  gravel: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85',
  sunset: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1200&q=85',
  crit: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=85',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85',
  topo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="800" height="1200" fill="%230b1120"/><path d="M0 200 C 200 150, 400 350, 800 180" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 350 C 250 280, 500 450, 800 320" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 500 C 300 420, 600 600, 800 480" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 650 C 200 580, 500 780, 800 620" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 800 C 350 720, 450 950, 800 800" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M 120 1080 Q 280 880, 400 620 T 680 180" stroke="%23c9f36a" stroke-width="6" stroke-dasharray="10 8" fill="none"/><circle cx="120" cy="1080" r="12" fill="%2338bdf8"/><circle cx="680" cy="180" r="14" fill="%23c9f36a"/></svg>',
};

const currentBackgroundSrc = computed(() => {
  if (rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl) {
    return rideForm.customPhotoUrl;
  }
  return (
    PRESET_BACKGROUNDS[rideForm.bgPreset as keyof typeof PRESET_BACKGROUNDS] ||
    PRESET_BACKGROUNDS.alpine
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
      toast.success('Foto Berhasil Dipasang!', 'Foto jepretan Anda kini menghiasi poster gowes.');
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
      foodEquivalency: '1 porsi Sate Maranggi + Es Kelapa Muda 🍢🥥',
      climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
      captions: {
        athlete: `🎯 ${distance}km · +${elev}m elevation gain · ${speed} km/h avg pace. Building endurance and power output with ${rideForm.bikeName}. #GowesKit #RideFlex`,
        humor: `🚴 Katanya gowes tipis-tipis cari sarapan, nyatanya disiksa tanjakan +${elev}m! Kaki auto getar pas pesen sate, tapi flexing jalan terus! 😂☕ #GowesSantai`,
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

  // 2. Theme Specific Vignette & Overlays
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (rideForm.templateStyle === 'cafe_santai') {
    gradient.addColorStop(0, 'rgba(45, 25, 15, 0.7)');
    gradient.addColorStop(0.4, 'rgba(45, 25, 15, 0.2)');
    gradient.addColorStop(0.7, 'rgba(25, 15, 10, 0.75)');
    gradient.addColorStop(1, 'rgba(20, 10, 5, 0.96)');
  } else {
    gradient.addColorStop(0, 'rgba(11, 17, 32, 0.8)');
    gradient.addColorStop(0.35, 'rgba(11, 17, 32, 0.25)');
    gradient.addColorStop(0.65, 'rgba(11, 17, 32, 0.75)');
    gradient.addColorStop(1, 'rgba(11, 17, 32, 0.98)');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Top Branding Pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, isStory ? 90 : 60, 360, 56, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#C9F36A';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('⚡ GOWESKIT RIDE PASS', 95, isStory ? 128 : 98);

  // 4. Sticker Badge if selected
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
      ctx.roundRect(canvas.width - 440, isStory ? 90 : 60, 370, 56, 28);
      ctx.fill();

      ctx.fillStyle = '#17202A';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(stickerText, canvas.width - 415, isStory ? 128 : 98);
    }
  }

  // 5. Main Hero Distance Callout
  const heroY = isStory ? 1020 : (isLandscape ? 420 : 470);

  // Large Prominent Distance
  ctx.fillStyle = '#C9F36A';
  ctx.font = '900 135px monospace';
  ctx.fillText(`${rideForm.distanceKm}`, 70, heroY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px sans-serif';
  ctx.fillText('KM', 70 + ctx.measureText(`${rideForm.distanceKm}`).width + 25, heroY - 45);

  // Ride Title & Subtitle
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 65);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah · ${aiRecap.value.climbGradeScore}`, 70, heroY + 110);

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
        <!-- Top Bar Header -->
        <header class="studio-topbar">
          <div class="studio-topbar-left">
            <span class="live-dot"></span>
            <span id="studio-title" class="studio-title">RIDE FLEX STUDIO &amp; AI</span>
          </div>
          <button
            type="button"
            class="studio-close-circle"
            aria-label="Tutup Studio"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>

        <!-- Studio Main Workspace: Side-by-Side on Desktop, Sticky Preview on Mobile -->
        <div class="studio-main-grid">
          <!-- LEFT PANE: LIVE POSTER STAGE -->
          <div class="poster-stage">
            <!-- Aspect Ratio Switcher (Above Poster for Instant Feedback) -->
            <div class="stage-ratio-pills">
              <button
                type="button"
                class="ratio-pill"
                :class="{ active: rideForm.aspectRatio === 'story' }"
                @click="rideForm.aspectRatio = 'story'"
              >
                📱 Story (9:16)
              </button>
              <button
                type="button"
                class="ratio-pill"
                :class="{ active: rideForm.aspectRatio === 'post' }"
                @click="rideForm.aspectRatio = 'post'"
              >
                🖼️ Square (1:1)
              </button>
              <button
                type="button"
                class="ratio-pill"
                :class="{ active: rideForm.aspectRatio === 'landscape' }"
                @click="rideForm.aspectRatio = 'landscape'"
              >
                🛣️ Banner (16:9)
              </button>
            </div>

            <!-- LIVE CANVAS POSTER CONTAINER -->
            <div
              class="poster-canvas-box"
              :class="[
                `poster--${rideForm.aspectRatio}`,
                `theme--${rideForm.templateStyle}`,
              ]"
              :style="{ backgroundImage: `url(${currentBackgroundSrc})` }"
            >
              <!-- Ambient Gradient Lighting -->
              <div class="poster-vignette"></div>

              <!-- Top Bar & Stickers -->
              <div class="poster-header-row">
                <div class="poster-badge-brand">
                  <span class="brand-bolt">⚡</span>
                  <span>GOWESKIT</span>
                </div>
                <div
                  v-if="rideForm.activeSticker !== 'none'"
                  class="poster-hologram-sticker"
                >
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

              <!-- Mid Hero Metric: Big Bold Kinetic Typography -->
              <div class="poster-hero-section">
                <div class="hero-num-wrapper">
                  <span class="hero-giant-number">{{ rideForm.distanceKm }}</span>
                  <span class="hero-giant-unit">KM</span>
                </div>
                <h3 class="poster-story-headline">{{ rideForm.title }}</h3>
                <div class="poster-specs-row">
                  <span>🚴 {{ rideForm.bikeName }}</span>
                  <span>·</span>
                  <span>{{ rideForm.temperatureC }}°C Cerah</span>
                </div>
              </div>

              <!-- Bottom Glassmorphism Telemetry Card -->
              <div class="poster-glass-card">
                <!-- Elevation Curve -->
                <div class="spark-elevation-row">
                  <span class="spark-label">ELEVASI PROFILE</span>
                  <span class="spark-val text-sky">+{{ rideForm.elevationM }}m Climb</span>
                </div>
                <svg viewBox="0 0 300 32" class="spark-svg-curve" aria-hidden="true">
                  <path
                    d="M0 28 Q 60 26, 120 14 T 220 8 L 300 4"
                    fill="none"
                    stroke="#38BDF8"
                    stroke-width="3"
                    stroke-linecap="round"
                  />
                  <circle cx="0" cy="28" r="3.5" fill="#38BDF8" />
                  <circle cx="300" cy="4" r="4.5" fill="#C9F36A" />
                </svg>

                <!-- 3 Telemetry Pillars -->
                <div class="telemetry-pillars-grid">
                  <div class="pillar-box">
                    <span class="pillar-tag">WAKTU</span>
                    <strong class="pillar-number">{{ formatDuration(rideForm.durationMinutes) }}</strong>
                  </div>
                  <div class="pillar-sep"></div>
                  <div class="pillar-box">
                    <span class="pillar-tag">AVG SPEED</span>
                    <strong class="pillar-number text-lime">{{ rideForm.avgSpeedKmH }} km/h</strong>
                  </div>
                  <div class="pillar-sep"></div>
                  <div class="pillar-box">
                    <span class="pillar-tag">KALORI</span>
                    <strong class="pillar-number text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
                  </div>
                </div>
              </div>

              <!-- Verified Footer -->
              <div class="poster-bottom-watermark">
                <span>⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID</span>
              </div>
            </div>
          </div>

          <!-- RIGHT PANE: CREATIVE STUDIO TOOLS & AI -->
          <div class="studio-tools-pane">
            <!-- Studio Tab Switcher -->
            <nav class="studio-tab-bar" aria-label="Studio Modes">
              <button
                type="button"
                class="studio-tab-btn"
                :class="{ active: activeTab === 'templates' }"
                @click="activeTab = 'templates'"
              >
                🎨 Template &amp; Foto
              </button>
              <button
                type="button"
                class="studio-tab-btn"
                :class="{ active: activeTab === 'ai' }"
                @click="activeTab = 'ai'"
              >
                ✨ Cerita AI &amp; Caption
              </button>
              <button
                type="button"
                class="studio-tab-btn"
                :class="{ active: activeTab === 'data' }"
                @click="activeTab = 'data'"
              >
                📊 Edit Data
              </button>
            </nav>

            <!-- TAB 1: TEMPLATES, BACKGROUNDS & STICKERS -->
            <div v-show="activeTab === 'templates'" class="tab-content-flow">
              <!-- Visual Style Preset Cards -->
              <section class="tool-section">
                <label class="tool-section-label">PILIH GAYA TEMPLATE POSTER</label>
                <div class="template-style-grid">
                  <button
                    type="button"
                    class="style-preset-card"
                    :class="{ active: rideForm.templateStyle === 'strava_bold' }"
                    @click="rideForm.templateStyle = 'strava_bold'"
                  >
                    <span class="style-icon">🔥</span>
                    <strong class="style-name">Strava Bold</strong>
                    <small class="style-desc">Kinetic Neon, Angka Besar, Telemetri Tajam</small>
                  </button>
                  <button
                    type="button"
                    class="style-preset-card"
                    :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
                    @click="rideForm.templateStyle = 'rapha_editorial'"
                  >
                    <span class="style-icon">🏔️</span>
                    <strong class="style-name">Rapha Editorial</strong>
                    <small class="style-desc">Clean Cycling Magazine &amp; Koordinat</small>
                  </button>
                  <button
                    type="button"
                    class="style-preset-card"
                    :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
                    @click="rideForm.templateStyle = 'cyber_hud'"
                  >
                    <span class="style-icon">⚡</span>
                    <strong class="style-name">Cyber HUD</strong>
                    <small class="style-desc">Futuristik Cyan/Lime &amp; Grade Sensor</small>
                  </button>
                  <button
                    type="button"
                    class="style-preset-card"
                    :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
                    @click="rideForm.templateStyle = 'cafe_santai'"
                  >
                    <span class="style-icon">☕</span>
                    <strong class="style-name">Kopi &amp; Kuliner</strong>
                    <small class="style-desc">Warm Caramel &amp; Fuel Sate Maranggi</small>
                  </button>
                </div>
              </section>

              <!-- Curated Visual Background Photos -->
              <section class="tool-section">
                <label class="tool-section-label">PILIHAN LATAR BELAKANG FOTO</label>
                <div class="visual-bg-grid">
                  <button
                    type="button"
                    class="bg-thumb-card"
                    :class="{ active: rideForm.bgPreset === 'alpine' }"
                    :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.alpine})` }"
                    @click="rideForm.bgPreset = 'alpine'"
                  >
                    <span class="bg-thumb-label">Alpine Pass</span>
                  </button>
                  <button
                    type="button"
                    class="bg-thumb-card"
                    :class="{ active: rideForm.bgPreset === 'gravel' }"
                    :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.gravel})` }"
                    @click="rideForm.bgPreset = 'gravel'"
                  >
                    <span class="bg-thumb-label">Gravel Pine</span>
                  </button>
                  <button
                    type="button"
                    class="bg-thumb-card"
                    :class="{ active: rideForm.bgPreset === 'sunset' }"
                    :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.sunset})` }"
                    @click="rideForm.bgPreset = 'sunset'"
                  >
                    <span class="bg-thumb-label">Sunset Coast</span>
                  </button>
                  <button
                    type="button"
                    class="bg-thumb-card"
                    :class="{ active: rideForm.bgPreset === 'crit' }"
                    :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.crit})` }"
                    @click="rideForm.bgPreset = 'crit'"
                  >
                    <span class="bg-thumb-label">Speed Crit</span>
                  </button>
                  <button
                    type="button"
                    class="bg-thumb-card"
                    :class="{ active: rideForm.bgPreset === 'cafe' }"
                    :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.cafe})` }"
                    @click="rideForm.bgPreset = 'cafe'"
                  >
                    <span class="bg-thumb-label">Coffee Stop</span>
                  </button>
                  <button
                    type="button"
                    class="bg-thumb-card bg-thumb-card--topo"
                    :class="{ active: rideForm.bgPreset === 'topo' }"
                    @click="rideForm.bgPreset = 'topo'"
                  >
                    <span class="bg-thumb-label">🗺️ Topo Neon</span>
                  </button>
                </div>

                <!-- 1-Tap Upload Custom Photo -->
                <label class="upload-photo-cta">
                  <input
                    type="file"
                    accept="image/*"
                    class="sr-only"
                    @change="handlePhotoUpload"
                  />
                  <span class="upload-badge-icon">📸</span>
                  <div class="upload-text-group">
                    <strong>Gunakan Foto Jepretan Sendiri</strong>
                    <small>Ambil langsung dari kamera HP atau galeri foto</small>
                  </div>
                </label>
              </section>

              <!-- Stickers Selector -->
              <section class="tool-section">
                <label class="tool-section-label">PILIH STIKER FLEXING</label>
                <div class="sticker-chips-cloud">
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'kom' }"
                    @click="rideForm.activeSticker = 'kom'"
                  >
                    👑 KOM Hunter
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'cafe' }"
                    @click="rideForm.activeSticker = 'cafe'"
                  >
                    ☕ Coffee Approved
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'beast' }"
                    @click="rideForm.activeSticker = 'beast'"
                  >
                    ⛰️ Climb Beast
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'speed' }"
                    @click="rideForm.activeSticker = 'speed'"
                  >
                    ⚡ Breakaway Pace
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'fuel' }"
                    @click="rideForm.activeSticker = 'fuel'"
                  >
                    🍲 Sate Maranggi Fuel
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'podium' }"
                    @click="rideForm.activeSticker = 'podium'"
                  >
                    🏁 Podium Finisher
                  </button>
                  <button
                    type="button"
                    class="hologram-chip"
                    :class="{ active: rideForm.activeSticker === 'none' }"
                    @click="rideForm.activeSticker = 'none'"
                  >
                    Tanpa Stiker
                  </button>
                </div>
              </section>
            </div>

            <!-- TAB 2: AGENTIC AI & MULTI-PERSONA CAPTIONS -->
            <div v-show="activeTab === 'ai'" class="tab-content-flow">
              <div class="ai-studio-panel">
                <div class="ai-hero-header">
                  <div class="ai-title-wrap">
                    <span class="ai-magic-star">✨</span>
                    <div>
                      <h4 class="ai-main-title">Agentic AI Ride Coach &amp; Storyteller</h4>
                      <p class="ai-sub-title">Otomatis buat caption flexing keren &amp; analisa performa</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="ai-trigger-pill"
                    :disabled="isAiGenerating"
                    @click="generateAiStory"
                  >
                    <span v-if="isAiGenerating" class="spin-icon">⏳</span>
                    <span v-else>🪄</span>
                    <span>{{ isAiGenerating ? 'Meracik AI...' : 'Generate Cerita Baru' }}</span>
                  </button>
                </div>

                <!-- Culinary Fuel Banner -->
                <div class="culinary-fuel-card">
                  <span class="fuel-badge-tag">🍢 INDONESIAN CYCLING FUEL EQUIVALENCY</span>
                  <strong class="fuel-text">{{ aiRecap.foodEquivalency }}</strong>
                  <small class="fuel-sub">Estimasi energi terbakar ~{{ rideForm.caloriesKcal }} kcal di tanjakan {{ aiRecap.climbGradeScore }}</small>
                </div>

                <!-- Persona Switcher -->
                <div class="persona-switch-deck">
                  <button
                    type="button"
                    class="persona-deck-card"
                    :class="{ active: selectedPersona === 'athlete' }"
                    @click="selectedPersona = 'athlete'"
                  >
                    <span class="persona-icon">🏆</span>
                    <div class="persona-text-col">
                      <strong>Gaya Atlet</strong>
                      <small>Fokus Power &amp; Pacing</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    class="persona-deck-card"
                    :class="{ active: selectedPersona === 'humor' }"
                    @click="selectedPersona = 'humor'"
                  >
                    <span class="persona-icon">😂</span>
                    <div class="persona-text-col">
                      <strong>Humor Santai</strong>
                      <small>Niat Tipis Kopi &amp; Sarapan</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    class="persona-deck-card"
                    :class="{ active: selectedPersona === 'technical' }"
                    @click="selectedPersona = 'technical'"
                  >
                    <span class="persona-icon">⚙️</span>
                    <div class="persona-text-col">
                      <strong>Tech Geek</strong>
                      <small>Drivetrain &amp; Spek Sepeda</small>
                    </div>
                  </button>
                </div>

                <!-- Caption Box -->
                <div class="caption-preview-box">
                  <p class="caption-p">{{ aiRecap.captions[selectedPersona] }}</p>
                  <div class="caption-footer-bar">
                    <span class="char-count">{{ aiRecap.captions[selectedPersona].length }} Karakter</span>
                    <button
                      type="button"
                      class="copy-magic-btn"
                      @click="copyCaption(aiRecap.captions[selectedPersona])"
                    >
                      📋 Salin Caption &amp; Hashtag
                    </button>
                  </div>
                </div>

                <!-- AI Mechanic Advice -->
                <div class="ai-mechanic-card">
                  <span class="mechanic-icon">🔧</span>
                  <p class="mechanic-text">{{ aiRecap.mechanicTip }}</p>
                </div>
              </div>
            </div>

            <!-- TAB 3: DATA METRICS -->
            <div v-show="activeTab === 'data'" class="tab-content-flow">
              <section class="tool-section">
                <label class="tool-section-label">SESUAIKAN DATA TELEMETRI GOWES</label>
                <div class="telemetry-inputs-grid">
                  <div class="form-group-item">
                    <label>Judul Sesi Gowes</label>
                    <input v-model="rideForm.title" type="text" />
                  </div>
                  <div class="form-group-item">
                    <label>Nama Sepeda</label>
                    <input v-model="rideForm.bikeName" type="text" />
                  </div>
                  <div class="form-group-item">
                    <label>Jarak Tempuh (km)</label>
                    <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
                  </div>
                  <div class="form-group-item">
                    <label>Elevasi Tanjakan (m)</label>
                    <input v-model.number="rideForm.elevationM" type="number" />
                  </div>
                  <div class="form-group-item">
                    <label>Durasi Total (Menit)</label>
                    <input v-model.number="rideForm.durationMinutes" type="number" />
                  </div>
                  <div class="form-group-item">
                    <label>Suhu Udara (°C)</label>
                    <input v-model.number="rideForm.temperatureC" type="number" />
                  </div>
                </div>
              </section>
            </div>

            <!-- Sticky Bottom Export Action Buttons -->
            <footer class="studio-bottom-actions">
              <button
                type="button"
                class="action-btn-share"
                :disabled="isExporting"
                @click="shareToMedia"
              >
                <span class="btn-icon">📲</span>
                <span>{{ isExporting ? 'Merender HD...' : 'Bagikan Langsung' }}</span>
              </button>
              <button
                type="button"
                class="action-btn-download"
                :disabled="isExporting"
                @click="downloadStoryImage"
              >
                <span class="btn-icon">💾</span>
                <span>Unduh Gambar HD (PNG)</span>
              </button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Backdrop Blur */
.studio-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(11, 17, 32, 0.92);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

/* Modal Shell */
.studio-modal-card {
  width: 100%;
  max-width: 62rem;
  max-height: 94vh;
  background: #0d1527;
  border: 1.5px solid rgba(201, 243, 106, 0.25);
  border-radius: 1.75rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(201, 243, 106, 0.08);
  color: #f8fafc;
}

/* Top Bar */
.studio-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.75rem;
  background: #080d18;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.studio-topbar-left {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.live-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--color-chain-lime);
  box-shadow: 0 0 12px var(--color-chain-lime);
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.studio-title {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: 0.05em;
}

.studio-close-circle {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 120ms ease;
}

.studio-close-circle:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Studio Main Workspace Grid */
.studio-main-grid {
  display: grid;
  grid-template-columns: 21.5rem 1fr;
  overflow-y: auto;
  gap: 1.75rem;
  padding: 1.75rem;
  align-items: start;
}

@media (max-width: 860px) {
  .studio-main-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1.25rem;
  }
}

/* LEFT PANE: POSTER STAGE */
.poster-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: sticky;
  top: 0;
}

/* Ratio Switcher Pills */
.stage-ratio-pills {
  display: flex;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.3rem;
  border-radius: 0.85rem;
  width: 100%;
}

.ratio-pill {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.45rem 0.25rem;
  font-size: 0.7rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.ratio-pill.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
}

/* POSTER CANVAS BOX */
.poster-canvas-box {
  width: 100%;
  max-width: 19.5rem;
  aspect-ratio: 9 / 16;
  border-radius: 1.35rem;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.15rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
}

.poster--post {
  aspect-ratio: 1 / 1;
}

.poster--landscape {
  aspect-ratio: 16 / 9;
}

.poster-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 17, 32, 0.8) 0%,
    rgba(11, 17, 32, 0.2) 35%,
    rgba(11, 17, 32, 0.75) 70%,
    rgba(11, 17, 32, 0.98) 100%
  );
  z-index: 1;
}

/* Poster Header */
.poster-header-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.poster-badge-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1.5px solid var(--color-chain-lime);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.poster-hologram-sticker {
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: #0f172a;
  font-size: 0.62rem;
  font-weight: 900;
  box-shadow: 0 2px 12px rgba(201, 243, 106, 0.4);
}

/* Poster Hero Kinetic Metric */
.poster-hero-section {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero-num-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  line-height: 0.95;
}

.hero-giant-number {
  font-family: var(--font-mono);
  font-size: 3rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: -0.05em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
}

.hero-giant-unit {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
}

.poster-story-headline {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 850;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poster-specs-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: #cbd5e1;
}

/* Poster Glass Card */
.poster-glass-card {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.88);
  border: 1.5px solid rgba(201, 243, 106, 0.35);
  border-radius: 1rem;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
}

.spark-elevation-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 850;
}

.spark-svg-curve {
  width: 100%;
  height: 1.4rem;
}

.telemetry-pillars-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.45rem;
}

.pillar-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.pillar-sep {
  width: 1px;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
}

.pillar-tag {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  font-weight: 800;
  color: #94a3b8;
}

.pillar-number {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime { color: var(--color-chain-lime); }
.text-sky { color: #38bdf8; }
.text-coral { color: #ff8c75; }

.poster-bottom-watermark {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 800;
  color: rgba(201, 243, 106, 0.8);
  margin-top: 0.25rem;
}

/* RIGHT PANE: TOOLS & CONTROLS */
.studio-tools-pane {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Tab Bar */
.studio-tab-bar {
  display: flex;
  gap: 0.5rem;
  background: #080d18;
  padding: 0.35rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.studio-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.65rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.studio-tab-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.tab-content-flow {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Tool Sections */
.tool-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tool-section-label {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

/* Style Preset Grid */
.template-style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.style-preset-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.85rem;
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.style-preset-card:hover {
  border-color: rgba(201, 243, 106, 0.4);
}

.style-preset-card.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.style-icon {
  font-size: 1.25rem;
}

.style-name {
  font-size: 0.85rem;
  font-weight: 850;
  color: #ffffff;
}

.style-desc {
  font-size: 0.68rem;
  color: #94a3b8;
  line-height: 1.3;
}

/* Visual Background Photos Grid */
.visual-bg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.bg-thumb-card {
  height: 5rem;
  border-radius: 0.85rem;
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-end;
  padding: 0.45rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 120ms ease;
}

.bg-thumb-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.9) 100%);
}

.bg-thumb-card.active {
  border-color: var(--color-chain-lime);
  box-shadow: 0 0 15px rgba(201, 243, 106, 0.4);
}

.bg-thumb-card--topo {
  background: #0b1120;
}

.bg-thumb-label {
  position: relative;
  z-index: 1;
  font-size: 0.68rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

/* Upload Custom Photo CTA */
.upload-photo-cta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.15rem;
  border-radius: 1rem;
  border: 1.5px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  cursor: pointer;
  transition: all 120ms ease;
}

.upload-photo-cta:hover {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.upload-badge-icon {
  font-size: 1.5rem;
}

.upload-text-group strong {
  display: block;
  font-size: 0.82rem;
  color: var(--color-chain-lime);
}

.upload-text-group small {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* Sticker Chips */
.sticker-chips-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.hologram-chip {
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.hologram-chip.active {
  background: var(--color-chain-lime);
  border-color: var(--color-chain-lime);
  color: #0f172a;
}

/* TAB 2: AI STORYTELLER PANEL */
.ai-studio-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95));
  border: 1.5px solid rgba(201, 243, 106, 0.3);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.ai-hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ai-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-magic-star {
  font-size: 1.5rem;
}

.ai-main-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffffff;
}

.ai-sub-title {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: #94a3b8;
}

.ai-trigger-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.95rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
  white-space: nowrap;
}

.ai-trigger-pill:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(201, 243, 106, 0.5);
}

.culinary-fuel-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: rgba(255, 140, 117, 0.1);
  border: 1px solid rgba(255, 140, 117, 0.3);
}

.fuel-badge-tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 900;
  color: #ff8c75;
}

.fuel-text {
  font-size: 0.92rem;
  color: #ffffff;
}

.fuel-sub {
  font-size: 0.7rem;
  color: #cbd5e1;
}

/* Persona Switcher Deck */
.persona-switch-deck {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.persona-deck-card {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.5rem;
  border-radius: 0.85rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.persona-deck-card.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.persona-icon {
  font-size: 1.25rem;
}

.persona-text-col strong {
  display: block;
  font-size: 0.78rem;
  color: #ffffff;
}

.persona-text-col small {
  font-size: 0.62rem;
  color: #94a3b8;
}

/* Caption Preview Box */
.caption-preview-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.95rem;
  background: rgba(11, 17, 32, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.caption-p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.55;
  color: #e2e8f0;
}

.caption-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.6rem;
}

.char-count {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: #64748b;
}

.copy-magic-btn {
  background: rgba(201, 243, 106, 0.15);
  border: 1.5px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.4rem 0.85rem;
  border-radius: 0.65rem;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 120ms ease;
}

.copy-magic-btn:hover {
  background: var(--color-chain-lime);
  color: #0f172a;
}

.ai-mechanic-card {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.mechanic-icon {
  font-size: 1rem;
}

.mechanic-text {
  margin: 0;
  font-size: 0.74rem;
  color: #bae6fd;
  line-height: 1.4;
}

/* TAB 3: DATA INPUTS */
.telemetry-inputs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.form-group-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group-item label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #94a3b8;
}

.form-group-item input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  padding: 0.55rem 0.75rem;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 750;
}

.form-group-item input:focus {
  outline: none;
  border-color: var(--color-chain-lime);
}

/* STICKY BOTTOM ACTIONS */
.studio-bottom-actions {
  display: flex;
  gap: 0.85rem;
  margin-top: 0.5rem;
  position: sticky;
  bottom: 0;
  background: #0d1527;
  padding-top: 0.5rem;
}

.action-btn-share {
  flex: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.95rem 1.25rem;
  border-radius: 1rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.92rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(201, 243, 106, 0.4);
  transition: all 120ms ease;
}

.action-btn-share:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 26px rgba(201, 243, 106, 0.55);
}

.action-btn-download {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.95rem 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.action-btn-download:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
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
