<script setup lang="ts">
import type { GenerateRideStoryResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { toast } = useNotify();

// Initial parameters from query string or defaults
const initialDistance = Number(route.query.distance) || 45.8;
const initialElevation = Number(route.query.elevation) || 580;
const initialDuration = Number(route.query.duration) || 105;
const initialNote = String(route.query.note || 'Morning Gravel Loop Sentul');
const initialBike = String(route.query.bike || 'Polygon Siskiu T7');

// Studio State
const activeTab = ref<'templates' | 'backgrounds' | 'stickers' | 'ai' | 'data'>('templates');

const rideForm = reactive({
  title: initialNote || 'Morning Gravel & Hills Rush',
  distanceKm: initialDistance,
  elevationM: initialElevation,
  durationMinutes: initialDuration,
  avgSpeedKmH: Number((initialDistance / Math.max(initialDuration / 60, 0.05)).toFixed(1)),
  caloriesKcal: 980,
  temperatureC: 25,
  bikeName: initialBike,
  templateStyle: 'strava_bold' as 'strava_bold' | 'rapha_editorial' | 'cyber_hud' | 'cafe_santai',
  aspectRatio: 'story' as 'story' | 'post' | 'landscape',
  activeSticker: 'kom' as 'kom' | 'cafe' | 'beast' | 'speed' | 'fuel' | 'podium' | 'none',
  bgPreset: 'alpine' as 'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'topo' | 'custom',
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
    athlete: `🎯 ${initialDistance} km · +${initialElevation}m Elevasi · Avg ${rideForm.avgSpeedKmH} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${initialBike}. Fokus recovery setelah membakar ~980 kcal. #GowesKit #RideFlex #CyclingLife #NoExcuses`,
    humor: `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${initialDistance} km dengan tanjakan ${initialElevation}m! Kaki auto getar pas pesen Sate Maranggi. Kopi dapet, konten dapet, flexing jalan! 😂☕ #GowesSantai #NoWacana #GowesKit`,
    technical: `⚙️ Rute: ${initialNote} (${initialDistance} km). Setup drivetrain pada ${initialBike} bekerja mulus di gradien Cat 2 Mountain Pass. Kecepatan rata-rata ${rideForm.avgSpeedKmH} km/h dengan efisiensi putaran crank optimal. Suhu 25°C. #BikeSpecs #GowesKit`,
  },
  mechanicTip: `💡 Saran AI Mekanik: Setelah elevasi +${initialElevation}m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.`,
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
  topo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200"><rect width="800" height="1200" fill="%230b1120"/><path d="M0 200 C 200 150, 400 350, 800 180" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 350 C 250 280, 500 450, 800 320" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 500 C 300 420, 600 600, 800 480" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 650 C 200 580, 500 780, 800 620" stroke="%23334155" stroke-width="2.5" fill="none" opacity="0.6"/><path d="M0 800 C 350 720, 450 950, 800 800" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M0 950 C 220 880, 550 1100, 800 950" stroke="%23334155" stroke-width="2" fill="none" opacity="0.6"/><path d="M 120 1080 Q 280 880, 400 620 T 680 180" stroke="%23c9f36a" stroke-width="6" stroke-dasharray="10 8" fill="none"/><circle cx="120" cy="1080" r="12" fill="%2338bdf8"/><circle cx="680" cy="180" r="14" fill="%23c9f36a"/></svg>',
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
      toast.success('Foto Berhasil Dipasang!', 'Foto jepretan Anda kini menjadi latar belakang poster.');
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
    // Offline heuristic fallback
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
  gradient.addColorStop(0, 'rgba(11, 17, 32, 0.82)');
  gradient.addColorStop(0.35, 'rgba(11, 17, 32, 0.25)');
  gradient.addColorStop(0.65, 'rgba(11, 17, 32, 0.78)');
  gradient.addColorStop(1, 'rgba(11, 17, 32, 0.98)');
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
  <div class="ride-flex-studio-page">
    <!-- Top Header Bar -->
    <header class="studio-header-nav">
      <div class="header-left">
        <NuxtLink to="/safety" class="back-pill-btn">
          <span>←</span>
          <span>Kembali</span>
        </NuxtLink>
        <div class="header-brand-title">
          <span class="bolt-glow">⚡</span>
          <h1>Ride Flex Studio</h1>
        </div>
      </div>

      <!-- Ratio Switcher in Header -->
      <div class="header-ratio-group">
        <button
          type="button"
          class="ratio-header-btn"
          :class="{ active: rideForm.aspectRatio === 'story' }"
          @click="rideForm.aspectRatio = 'story'"
        >
          📱 Story (9:16)
        </button>
        <button
          type="button"
          class="ratio-header-btn"
          :class="{ active: rideForm.aspectRatio === 'post' }"
          @click="rideForm.aspectRatio = 'post'"
        >
          🖼️ Square (1:1)
        </button>
        <button
          type="button"
          class="ratio-header-btn"
          :class="{ active: rideForm.aspectRatio === 'landscape' }"
          @click="rideForm.aspectRatio = 'landscape'"
        >
          🛣️ Banner (16:9)
        </button>
      </div>

      <!-- Header Action Buttons -->
      <div class="header-actions">
        <button
          type="button"
          class="header-btn-download"
          :disabled="isExporting"
          @click="downloadStoryImage"
        >
          <span>💾</span>
          <span class="hide-mobile">Unduh PNG</span>
        </button>
        <button
          type="button"
          class="header-btn-share"
          :disabled="isExporting"
          @click="shareToMedia"
        >
          <span>📲</span>
          <span>Bagikan</span>
        </button>
      </div>
    </header>

    <!-- Studio Main Body -->
    <main class="studio-body-container">
      <!-- LEFT / TOP: HERO POSTER SHOWCASE (STICKY) -->
      <section class="poster-stage-column" aria-label="Live Poster Preview">
        <div
          class="live-poster-card"
          :class="[
            `poster--${rideForm.aspectRatio}`,
            `theme--${rideForm.templateStyle}`,
          ]"
          :style="{ backgroundImage: `url(${currentBackgroundSrc})` }"
        >
          <!-- Vignette Lighting Overlay -->
          <div class="poster-card-vignette"></div>

          <!-- Poster Top Branding & Hologram Sticker -->
          <div class="poster-card-topbar">
            <div class="poster-chip-brand">
              <span class="bolt-lime">⚡</span>
              <span>GOWESKIT</span>
            </div>
            <div
              v-if="rideForm.activeSticker !== 'none'"
              class="poster-chip-sticker"
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

          <!-- Poster Mid Hero Metric: Big Kinetic Mileage -->
          <div class="poster-card-hero">
            <div class="hero-mileage-row">
              <span class="hero-mileage-val">{{ rideForm.distanceKm }}</span>
              <span class="hero-mileage-unit">KM</span>
            </div>
            <h2 class="hero-poster-title">{{ rideForm.title }}</h2>
            <div class="hero-meta-strip">
              <span>🚴 {{ rideForm.bikeName }}</span>
              <span>·</span>
              <span>{{ rideForm.temperatureC }}°C Cerah</span>
            </div>
          </div>

          <!-- Poster Bottom Telemetry Glass Card -->
          <div class="poster-card-telemetry">
            <div class="elevation-spark-row">
              <span class="spark-title">ELEVASI PROFILE</span>
              <strong class="spark-gain-text">+{{ rideForm.elevationM }}m Climb</strong>
            </div>
            <svg viewBox="0 0 300 32" class="spark-elevation-svg" aria-hidden="true">
              <path
                d="M0 28 Q 60 26, 120 14 T 220 8 L 300 4"
                fill="none"
                stroke="#38BDF8"
                stroke-width="3.5"
                stroke-linecap="round"
              />
              <circle cx="0" cy="28" r="3.5" fill="#38BDF8" />
              <circle cx="300" cy="4" r="4.5" fill="#C9F36A" />
            </svg>

            <!-- 3 Telemetry Pillars -->
            <div class="telemetry-values-grid">
              <div class="telemetry-col">
                <span class="col-label">WAKTU</span>
                <strong class="col-val">{{ formatDuration(rideForm.durationMinutes) }}</strong>
              </div>
              <div class="col-divider"></div>
              <div class="telemetry-col">
                <span class="col-label">AVG SPEED</span>
                <strong class="col-val text-lime">{{ rideForm.avgSpeedKmH }} km/h</strong>
              </div>
              <div class="col-divider"></div>
              <div class="telemetry-col">
                <span class="col-label">KALORI</span>
                <strong class="col-val text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
              </div>
            </div>
          </div>

          <!-- Watermark -->
          <div class="poster-card-watermark">
            <span>⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID</span>
          </div>
        </div>
      </section>

      <!-- RIGHT / BOTTOM: STUDIO TOOLS & AI CONTROLS -->
      <section class="tools-stage-column" aria-label="Studio Controls">
        <!-- Modern Segmented Tool Tabs -->
        <nav class="studio-segmented-tabs" aria-label="Tool Tabs">
          <button
            type="button"
            class="segmented-tab-btn"
            :class="{ active: activeTab === 'templates' }"
            @click="activeTab = 'templates'"
          >
            🎨 Template
          </button>
          <button
            type="button"
            class="segmented-tab-btn"
            :class="{ active: activeTab === 'backgrounds' }"
            @click="activeTab = 'backgrounds'"
          >
            📸 Foto
          </button>
          <button
            type="button"
            class="segmented-tab-btn"
            :class="{ active: activeTab === 'stickers' }"
            @click="activeTab = 'stickers'"
          >
            🏷️ Stiker
          </button>
          <button
            type="button"
            class="segmented-tab-btn"
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >
            ✨ AI Cerita
          </button>
          <button
            type="button"
            class="segmented-tab-btn"
            :class="{ active: activeTab === 'data' }"
            @click="activeTab = 'data'"
          >
            📊 Data
          </button>
        </nav>

        <!-- TAB 1: TEMPLATE STYLES -->
        <div v-show="activeTab === 'templates'" class="tab-pane-card">
          <div class="tab-pane-header">
            <h3>Pilih Gaya Template Poster</h3>
            <p>Ubah atmosfer layout dan tipografi sesuai tema gowes Anda.</p>
          </div>
          <div class="template-choices-grid">
            <button
              type="button"
              class="style-choice-card"
              :class="{ active: rideForm.templateStyle === 'strava_bold' }"
              @click="rideForm.templateStyle = 'strava_bold'"
            >
              <span class="choice-badge">🔥 BOLD</span>
              <strong class="choice-title">Strava Pro Neon</strong>
              <p class="choice-desc">Tipografi kinetik tebal, angka raksasa, kontras tinggi.</p>
            </button>
            <button
              type="button"
              class="style-choice-card"
              :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
              @click="rideForm.templateStyle = 'rapha_editorial'"
            >
              <span class="choice-badge">🏔️ CLASSIC</span>
              <strong class="choice-title">Rapha Editorial</strong>
              <p class="choice-desc">Gaya majalah sepeda Eropa dengan koordinat GPS.</p>
            </button>
            <button
              type="button"
              class="style-choice-card"
              :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
              @click="rideForm.templateStyle = 'cyber_hud'"
            >
              <span class="choice-badge">⚡ CYBER</span>
              <strong class="choice-title">Cyber Telemetry</strong>
              <p class="choice-desc">Dashboard sensor digital cyan &amp; lime futuristik.</p>
            </button>
            <button
              type="button"
              class="style-choice-card"
              :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
              @click="rideForm.templateStyle = 'cafe_santai'"
            >
              <span class="choice-badge">☕ COFFEE</span>
              <strong class="choice-title">Kopi &amp; Sate Maranggi</strong>
              <p class="choice-desc">Nuansa hangat santai dengan callout kuliner lokal.</p>
            </button>
          </div>
        </div>

        <!-- TAB 2: BACKGROUND PHOTOS -->
        <div v-show="activeTab === 'backgrounds'" class="tab-pane-card">
          <div class="tab-pane-header">
            <h3>Pilihan Latar Belakang Estetis</h3>
            <p>Pilih foto panorama sepeda atau unggah hasil jepretan Anda sendiri.</p>
          </div>

          <!-- Real Visual Cards -->
          <div class="photo-cards-grid">
            <button
              type="button"
              class="photo-select-card"
              :class="{ active: rideForm.bgPreset === 'alpine' }"
              :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.alpine})` }"
              @click="rideForm.bgPreset = 'alpine'"
            >
              <span class="photo-card-tag">🏔️ Alpine Pass</span>
            </button>
            <button
              type="button"
              class="photo-select-card"
              :class="{ active: rideForm.bgPreset === 'gravel' }"
              :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.gravel})` }"
              @click="rideForm.bgPreset = 'gravel'"
            >
              <span class="photo-card-tag">🌲 Gravel Pine</span>
            </button>
            <button
              type="button"
              class="photo-select-card"
              :class="{ active: rideForm.bgPreset === 'sunset' }"
              :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.sunset})` }"
              @click="rideForm.bgPreset = 'sunset'"
            >
              <span class="photo-card-tag">🌅 Sunset Coast</span>
            </button>
            <button
              type="button"
              class="photo-select-card"
              :class="{ active: rideForm.bgPreset === 'crit' }"
              :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.crit})` }"
              @click="rideForm.bgPreset = 'crit'"
            >
              <span class="photo-card-tag">⚡ Speed Crit</span>
            </button>
            <button
              type="button"
              class="photo-select-card"
              :class="{ active: rideForm.bgPreset === 'cafe' }"
              :style="{ backgroundImage: `url(${PRESET_BACKGROUNDS.cafe})` }"
              @click="rideForm.bgPreset = 'cafe'"
            >
              <span class="photo-card-tag">☕ Coffee Stop</span>
            </button>
            <button
              type="button"
              class="photo-select-card photo-select-card--topo"
              :class="{ active: rideForm.bgPreset === 'topo' }"
              @click="rideForm.bgPreset = 'topo'"
            >
              <span class="photo-card-tag">🗺️ Topo Neon Vektor</span>
            </button>
          </div>

          <!-- Upload Own Photo -->
          <label class="photo-upload-banner">
            <input
              type="file"
              accept="image/*"
              class="sr-only"
              @change="handlePhotoUpload"
            />
            <span class="upload-icon-large">📸</span>
            <div class="upload-copy">
              <strong>Unggah Foto Sendiri dari Galeri / Kamera</strong>
              <small>Format JPG, PNG, WebP otomatis dipasang ke poster</small>
            </div>
          </label>
        </div>

        <!-- TAB 3: STICKERS -->
        <div v-show="activeTab === 'stickers'" class="tab-pane-card">
          <div class="tab-pane-header">
            <h3>Stiker Flexing &amp; Badge</h3>
            <p>Sematkan lencana pencapaian di sudut poster Anda.</p>
          </div>
          <div class="stickers-choice-deck">
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'kom' }"
              @click="rideForm.activeSticker = 'kom'"
            >
              <span class="sticker-emoji">👑</span>
              <div class="sticker-info">
                <strong>KOM / PR Hunter</strong>
                <small>Raja Tanjakan &amp; Rekor Pribadi</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'cafe' }"
              @click="rideForm.activeSticker = 'cafe'"
            >
              <span class="sticker-emoji">☕</span>
              <div class="sticker-info">
                <strong>Coffee Approved</strong>
                <small>Sesi Gowes Santai &amp; Ngopi</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'beast' }"
              @click="rideForm.activeSticker = 'beast'"
            >
              <span class="sticker-emoji">⛰️</span>
              <div class="sticker-info">
                <strong>Climb Beast</strong>
                <small>Penakluk Elevasi Berat</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'speed' }"
              @click="rideForm.activeSticker = 'speed'"
            >
              <span class="sticker-emoji">⚡</span>
              <div class="sticker-info">
                <strong>Breakaway Pace</strong>
                <small>Kecepatan Rata-Rata Tinggi</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'fuel' }"
              @click="rideForm.activeSticker = 'fuel'"
            >
              <span class="sticker-emoji">🍲</span>
              <div class="sticker-info">
                <strong>Sate Maranggi Fuel</strong>
                <small>Kalori Terbakar Setara Porsi Kuliner</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-badge-card"
              :class="{ active: rideForm.activeSticker === 'none' }"
              @click="rideForm.activeSticker = 'none'"
            >
              <span class="sticker-emoji">🚫</span>
              <div class="sticker-info">
                <strong>Tanpa Stiker</strong>
                <small>Tampilan Bersih &amp; Minimalis</small>
              </div>
            </button>
          </div>
        </div>

        <!-- TAB 4: AGENTIC AI STORYTELLER & CAPTIONS -->
        <div v-show="activeTab === 'ai'" class="tab-pane-card">
          <div class="ai-header-strip">
            <div class="ai-tag-group">
              <span class="magic-spark-glow">✨</span>
              <div>
                <h3 class="ai-strip-heading">Agentic AI Ride Coach &amp; Storyteller</h3>
                <p class="ai-strip-sub">Buat caption flexing, analisa bakar kalori, dan tips mekanik otomatis.</p>
              </div>
            </div>
            <button
              type="button"
              class="generate-ai-magic-btn"
              :disabled="isAiGenerating"
              @click="generateAiStory"
            >
              <span v-if="isAiGenerating" class="spin-icon">⏳</span>
              <span v-else>🪄</span>
              <span>{{ isAiGenerating ? 'Meracik AI...' : 'Generate Cerita Baru' }}</span>
            </button>
          </div>

          <!-- Indonesian Food Equivalency Banner -->
          <div class="fuel-callout-box">
            <div class="fuel-badge-pill">🍢 FUEL EQUIVALENCY</div>
            <strong class="fuel-title">{{ aiRecap.foodEquivalency }}</strong>
            <small class="fuel-desc">Membakar energi ~{{ rideForm.caloriesKcal }} kcal di tanjakan {{ aiRecap.climbGradeScore }}</small>
          </div>

          <!-- Persona Tabs -->
          <div class="persona-selector-deck">
            <button
              type="button"
              class="persona-deck-btn"
              :class="{ active: selectedPersona === 'athlete' }"
              @click="selectedPersona = 'athlete'"
            >
              <span class="p-icon">🏆</span>
              <div class="p-text">
                <strong>Gaya Atlet</strong>
                <small>Power &amp; Pacing</small>
              </div>
            </button>
            <button
              type="button"
              class="persona-deck-btn"
              :class="{ active: selectedPersona === 'humor' }"
              @click="selectedPersona = 'humor'"
            >
              <span class="p-icon">😂</span>
              <div class="p-text">
                <strong>Humor Santai</strong>
                <small>Niat Tipis Kopi</small>
              </div>
            </button>
            <button
              type="button"
              class="persona-deck-btn"
              :class="{ active: selectedPersona === 'technical' }"
              @click="selectedPersona = 'technical'"
            >
              <span class="p-icon">⚙️</span>
              <div class="p-text">
                <strong>Tech Geek</strong>
                <small>Drivetrain &amp; Spek</small>
              </div>
            </button>
          </div>

          <!-- Live Caption Box -->
          <div class="caption-card-box">
            <p class="caption-text-body">{{ aiRecap.captions[selectedPersona] }}</p>
            <div class="caption-card-action">
              <span class="caption-length-tag">{{ aiRecap.captions[selectedPersona].length }} Karakter</span>
              <button
                type="button"
                class="copy-caption-pill"
                @click="copyCaption(aiRecap.captions[selectedPersona])"
              >
                📋 Salin Caption &amp; Tagar
              </button>
            </div>
          </div>

          <!-- AI Mechanic Preventive Advice -->
          <div class="ai-mechanic-alert">
            <span class="alert-icon">🔧</span>
            <p class="alert-text">{{ aiRecap.mechanicTip }}</p>
          </div>
        </div>

        <!-- TAB 5: TELEMETRY DATA INPUTS -->
        <div v-show="activeTab === 'data'" class="tab-pane-card">
          <div class="tab-pane-header">
            <h3>Sesuaikan Data Telemetri Gowes</h3>
            <p>Ubah nilai metrik untuk disesuaikan pada poster secara langsung.</p>
          </div>
          <div class="inputs-grid-layout">
            <div class="input-field-box">
              <label>Judul Sesi Gowes</label>
              <input v-model="rideForm.title" type="text" />
            </div>
            <div class="input-field-box">
              <label>Nama Sepeda</label>
              <input v-model="rideForm.bikeName" type="text" />
            </div>
            <div class="input-field-box">
              <label>Jarak Tempuh (km)</label>
              <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
            </div>
            <div class="input-field-box">
              <label>Elevasi Tanjakan (m)</label>
              <input v-model.number="rideForm.elevationM" type="number" />
            </div>
            <div class="input-field-box">
              <label>Durasi Total (Menit)</label>
              <input v-model.number="rideForm.durationMinutes" type="number" />
            </div>
            <div class="input-field-box">
              <label>Suhu Udara (°C)</label>
              <input v-model.number="rideForm.temperatureC" type="number" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Studio Page Layout */
.ride-flex-studio-page {
  min-height: 100vh;
  background: #090e1a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Header Navbar */
.studio-header-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.5rem;
  background: #060a12;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  transition: all 120ms ease;
}

.back-pill-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.header-brand-title {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.bolt-glow {
  font-size: 1.25rem;
  color: var(--color-chain-lime);
}

.header-brand-title h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
}

/* Header Ratio Selector */
.header-ratio-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.ratio-header-btn {
  background: transparent;
  border: none;
  padding: 0.4rem 0.75rem;
  font-size: 0.74rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.ratio-header-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.header-btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.header-btn-download:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}

.header-btn-share {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.15rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.82rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
}

.header-btn-share:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(201, 243, 106, 0.5);
}

/* Studio Body Grid Layout */
.studio-body-container {
  display: grid;
  grid-template-columns: 24rem 1fr;
  gap: 2rem;
  max-width: 78rem;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1.5rem;
  align-items: start;
}

@media (max-width: 960px) {
  .studio-body-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1rem;
  }
}

/* LEFT POSTER STAGE */
.poster-stage-column {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 4.5rem;
}

.live-poster-card {
  width: 100%;
  max-width: 22rem;
  aspect-ratio: 9 / 16;
  border-radius: 1.5rem;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.35rem;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(201, 243, 106, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  transition: all 200ms ease;
}

.poster--post {
  aspect-ratio: 1 / 1;
}

.poster--landscape {
  aspect-ratio: 16 / 9;
}

.poster-card-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 17, 32, 0.82) 0%,
    rgba(11, 17, 32, 0.2) 35%,
    rgba(11, 17, 32, 0.78) 70%,
    rgba(11, 17, 32, 0.98) 100%
  );
  z-index: 1;
}

/* Top Bar Inside Poster */
.poster-card-topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.poster-chip-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.92);
  border: 1.5px solid var(--color-chain-lime);
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.6);
}

.bolt-lime {
  color: var(--color-chain-lime);
}

.poster-chip-sticker {
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: #0f172a;
  font-size: 0.65rem;
  font-weight: 900;
  box-shadow: 0 4px 14px rgba(201, 243, 106, 0.4);
}

/* Mid Hero Mileage Inside Poster */
.poster-card-hero {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero-mileage-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  line-height: 0.92;
}

.hero-mileage-val {
  font-family: var(--font-mono);
  font-size: 3.4rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: -0.05em;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.9);
}

.hero-mileage-unit {
  font-size: 1.3rem;
  font-weight: 900;
  color: #ffffff;
}

.hero-poster-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-meta-strip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #cbd5e1;
}

/* Telemetry Card Inside Poster */
.poster-card-telemetry {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.88);
  border: 1.5px solid rgba(201, 243, 106, 0.35);
  border-radius: 1.15rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  backdrop-filter: blur(12px);
}

.elevation-spark-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
}

.spark-title {
  color: #94a3b8;
}

.spark-gain-text {
  color: #38bdf8;
}

.spark-elevation-svg {
  width: 100%;
  height: 1.5rem;
}

.telemetry-values-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.5rem;
}

.telemetry-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.col-divider {
  width: 1px;
  height: 1.6rem;
  background: rgba(255, 255, 255, 0.1);
}

.col-label {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 800;
  color: #94a3b8;
}

.col-val {
  font-family: var(--font-mono);
  font-size: 0.88rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime { color: var(--color-chain-lime); }
.text-coral { color: #ff8c75; }

.poster-card-watermark {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 800;
  color: rgba(201, 243, 106, 0.8);
  margin-top: 0.35rem;
}

/* RIGHT TOOLS PANE */
.tools-stage-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Segmented Tabs */
.studio-segmented-tabs {
  display: flex;
  gap: 0.4rem;
  background: #060a12;
  padding: 0.35rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
}

.segmented-tab-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.65rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.segmented-tab-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

/* Tab Panes */
.tab-pane-card {
  background: #0d1527;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.35rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

.tab-pane-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #ffffff;
}

.tab-pane-header p {
  margin: 0.2rem 0 0;
  font-size: 0.78rem;
  color: #94a3b8;
}

/* Template Choices Grid */
.template-choices-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .template-choices-grid {
    grid-template-columns: 1fr;
  }
}

.style-choice-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.style-choice-card:hover {
  border-color: rgba(201, 243, 106, 0.4);
  background: rgba(30, 41, 59, 0.8);
}

.style-choice-card.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
  box-shadow: 0 0 20px rgba(201, 243, 106, 0.15);
}

.choice-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.choice-title {
  font-size: 0.95rem;
  font-weight: 850;
  color: #ffffff;
}

.choice-desc {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.35;
}

/* Visual Photo Cards Grid */
.photo-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .photo-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.photo-select-card {
  height: 5.5rem;
  border-radius: 1rem;
  background-size: cover;
  background-position: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-end;
  padding: 0.55rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 120ms ease;
}

.photo-select-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(11, 17, 32, 0.9) 100%);
}

.photo-select-card.active {
  border-color: var(--color-chain-lime);
  box-shadow: 0 0 16px rgba(201, 243, 106, 0.4);
}

.photo-select-card--topo {
  background: #0b1120;
}

.photo-card-tag {
  position: relative;
  z-index: 1;
  font-size: 0.72rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

/* Upload Photo Banner */
.photo-upload-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 1.15rem;
  border: 2px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  cursor: pointer;
  transition: all 120ms ease;
}

.photo-upload-banner:hover {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.upload-icon-large {
  font-size: 1.75rem;
}

.upload-copy strong {
  display: block;
  font-size: 0.88rem;
  color: var(--color-chain-lime);
}

.upload-copy small {
  font-size: 0.74rem;
  color: #94a3b8;
}

/* Stickers Deck */
.stickers-choice-deck {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .stickers-choice-deck {
    grid-template-columns: 1fr;
  }
}

.sticker-badge-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.sticker-badge-card.active {
  background: rgba(201, 243, 106, 0.12);
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.sticker-emoji {
  font-size: 1.5rem;
}

.sticker-info strong {
  display: block;
  font-size: 0.85rem;
  color: #ffffff;
}

.sticker-info small {
  font-size: 0.7rem;
  color: #94a3b8;
}

/* AI Studio Tab Panel */
.ai-header-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

@media (max-width: 640px) {
  .ai-header-strip {
    flex-direction: column;
    align-items: stretch;
  }
}

.ai-tag-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.magic-spark-glow {
  font-size: 1.75rem;
}

.ai-strip-heading {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #ffffff;
}

.ai-strip-sub {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.generate-ai-magic-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1.15rem;
  border-radius: 0.85rem;
  background: var(--color-chain-lime);
  color: #0f172a;
  border: none;
  font-size: 0.82rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
  white-space: nowrap;
}

.generate-ai-magic-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 243, 106, 0.5);
}

.fuel-callout-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1.15rem;
  border-radius: 1rem;
  background: rgba(255, 140, 117, 0.1);
  border: 1.5px solid rgba(255, 140, 117, 0.3);
}

.fuel-badge-pill {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: #ff8c75;
}

.fuel-title {
  font-size: 0.98rem;
  color: #ffffff;
}

.fuel-desc {
  font-size: 0.74rem;
  color: #cbd5e1;
}

.persona-selector-deck {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

@media (max-width: 640px) {
  .persona-selector-deck {
    grid-template-columns: 1fr;
  }
}

.persona-deck-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.persona-deck-btn.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.p-icon {
  font-size: 1.4rem;
}

.p-text strong {
  display: block;
  font-size: 0.85rem;
  color: #ffffff;
}

.p-text small {
  font-size: 0.68rem;
  color: #94a3b8;
}

.caption-card-box {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem;
  border-radius: 1.15rem;
  background: rgba(11, 17, 32, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.caption-text-body {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #f1f5f9;
}

.caption-card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.75rem;
}

.caption-length-tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: #64748b;
}

.copy-caption-pill {
  background: rgba(201, 243, 106, 0.15);
  border: 1.5px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.45rem 0.95rem;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 120ms ease;
}

.copy-caption-pill:hover {
  background: var(--color-chain-lime);
  color: #0f172a;
}

.ai-mechanic-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.alert-icon {
  font-size: 1.1rem;
}

.alert-text {
  margin: 0;
  font-size: 0.78rem;
  color: #bae6fd;
  line-height: 1.45;
}

/* Data Inputs Grid */
.inputs-grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .inputs-grid-layout {
    grid-template-columns: 1fr;
  }
}

.input-field-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-field-box label {
  font-size: 0.74rem;
  font-weight: 800;
  color: #94a3b8;
}

.input-field-box input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.85rem;
  padding: 0.65rem 0.85rem;
  color: #ffffff;
  font-size: 0.86rem;
  font-weight: 750;
}

.input-field-box input:focus {
  outline: none;
  border-color: var(--color-chain-lime);
}

.hide-mobile {
  display: inline;
}

@media (max-width: 640px) {
  .hide-mobile {
    display: none;
  }
  .header-ratio-group {
    display: none;
  }
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

.spin-icon {
  display: inline-block;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
