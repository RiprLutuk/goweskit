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

// 🤖 Agentic AI Generator
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

  // Background Gradient Palette by Preset
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

  // If custom photo uploaded, render it with smooth opacity
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
      // gradient fallback already drawn
    }
  }

  // Draw Topographic Background Curves
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.25);
  ctx.bezierCurveTo(canvas.width * 0.3, canvas.height * 0.18, canvas.width * 0.7, canvas.height * 0.35, canvas.width, canvas.height * 0.22);
  ctx.moveTo(0, canvas.height * 0.45);
  ctx.bezierCurveTo(canvas.width * 0.4, canvas.height * 0.38, canvas.width * 0.6, canvas.height * 0.55, canvas.width, canvas.height * 0.42);
  ctx.moveTo(0, canvas.height * 0.65);
  ctx.bezierCurveTo(canvas.width * 0.2, canvas.height * 0.58, canvas.width * 0.8, canvas.height * 0.75, canvas.width, canvas.height * 0.62);
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

  // Sticker Badge if selected
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

  // Hero Distance
  const heroY = isStory ? 1040 : (isLandscape ? 420 : 470);

  ctx.fillStyle = '#C9F36A';
  ctx.font = '900 145px monospace';
  ctx.fillText(`${rideForm.distanceKm}`, 70, heroY);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 56px sans-serif';
  ctx.fillText('KM', 70 + ctx.measureText(`${rideForm.distanceKm}`).width + 25, heroY - 50);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px sans-serif';
  ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 70);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah · ${aiRecap.value.climbGradeScore}`, 70, heroY + 120);

  // Stats Card
  const cardY = heroY + 155;
  const cardH = isStory ? 480 : (isLandscape ? 340 : 360);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, cardY, canvas.width - 140, cardH, 32);
  ctx.fill();
  ctx.stroke();

  // Elevation Sparkline
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(120, cardY + 80);
  ctx.bezierCurveTo(340, cardY + 20, 600, cardY + 75, canvas.width - 120, cardY + 40);
  ctx.stroke();

  // Metrics Grid
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

  // Provenance Footer
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
  <div class="creator-studio-viewport">
    <!-- Studio Header Navigation -->
    <header class="creator-studio-nav">
      <div class="nav-left">
        <NuxtLink to="/safety" class="nav-back-button" aria-label="Kembali ke Dashboard">
          <span class="nav-back-arrow">←</span>
          <span class="nav-back-text">Kembali</span>
        </NuxtLink>
        <div class="nav-brand-lockup">
          <span class="brand-spark">⚡</span>
          <h1 class="brand-title">Ride Flex Studio</h1>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="nav-actions">
        <button
          type="button"
          class="btn-nav-download"
          :disabled="isExporting"
          @click="downloadStoryImage"
        >
          <span>💾</span>
          <span class="btn-text-full">Unduh HD</span>
        </button>
        <button
          type="button"
          class="btn-nav-share"
          :disabled="isExporting"
          @click="shareToMedia"
        >
          <span>📲</span>
          <span>Bagikan</span>
        </button>
      </div>
    </header>

    <!-- Ratio Selector Bar -->
    <div class="studio-ratio-bar">
      <div class="ratio-pills-wrap">
        <button
          type="button"
          class="ratio-toggle-pill"
          :class="{ active: rideForm.aspectRatio === 'story' }"
          @click="rideForm.aspectRatio = 'story'"
        >
          📱 Story (9:16)
        </button>
        <button
          type="button"
          class="ratio-toggle-pill"
          :class="{ active: rideForm.aspectRatio === 'post' }"
          @click="rideForm.aspectRatio = 'post'"
        >
          🖼️ Square (1:1)
        </button>
        <button
          type="button"
          class="ratio-toggle-pill"
          :class="{ active: rideForm.aspectRatio === 'landscape' }"
          @click="rideForm.aspectRatio = 'landscape'"
        >
          🛣️ Banner (16:9)
        </button>
      </div>
    </div>

    <!-- Main Workspace -->
    <main class="creator-workspace">
      <!-- 1. LIVE POSTER STAGE (STICKY / TOP HERO) -->
      <div class="poster-display-stage">
        <div
          class="poster-canvas-frame"
          :class="[
            `frame--${rideForm.aspectRatio}`,
            `bg--${rideForm.bgPreset}`,
            `theme--${rideForm.templateStyle}`,
          ]"
          :style="rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl ? { backgroundImage: `url(${rideForm.customPhotoUrl})` } : {}"
        >
          <!-- Vector Topo Wave Overlay -->
          <svg class="topo-bg-layer" viewBox="0 0 400 700" fill="none" aria-hidden="true">
            <path d="M-50 120 C 80 80, 220 220, 450 100" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2" />
            <path d="M-50 250 C 120 180, 280 340, 450 220" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2.5" />
            <path d="M-50 400 C 100 320, 300 480, 450 360" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2" />
            <path d="M-50 560 C 150 480, 250 640, 450 520" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2.5" />
          </svg>

          <!-- Lighting Vignette -->
          <div class="poster-lighting-vignette"></div>

          <!-- Top Header Strip inside Poster -->
          <div class="poster-inner-header">
            <div class="inner-brand-badge">
              <span class="badge-bolt">⚡</span>
              <span>GOWESKIT</span>
            </div>
            <div
              v-if="rideForm.activeSticker !== 'none'"
              class="inner-sticker-badge"
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

          <!-- Middle Hero Typography -->
          <div class="poster-inner-hero">
            <div class="hero-mileage-lockup">
              <span class="hero-mileage-number">{{ rideForm.distanceKm }}</span>
              <span class="hero-mileage-suffix">KM</span>
            </div>
            <h2 class="hero-session-title">{{ rideForm.title }}</h2>
            <div class="hero-session-meta">
              <span>🚴 {{ rideForm.bikeName }}</span>
              <span>·</span>
              <span>{{ rideForm.temperatureC }}°C Cerah</span>
            </div>
          </div>

          <!-- Bottom Telemetry Glass Card -->
          <div class="poster-inner-telemetry">
            <div class="sparkline-row">
              <span class="sparkline-label">ELEVASI PROFILE</span>
              <span class="sparkline-gain">+{{ rideForm.elevationM }}m Climb</span>
            </div>
            <svg viewBox="0 0 300 28" class="sparkline-svg" aria-hidden="true">
              <path
                d="M0 24 Q 70 22, 140 10 T 260 6 L 300 3"
                fill="none"
                stroke="#38BDF8"
                stroke-width="3"
                stroke-linecap="round"
              />
              <circle cx="0" cy="24" r="3" fill="#38BDF8" />
              <circle cx="300" cy="3" r="4" fill="#C9F36A" />
            </svg>

            <div class="telemetry-triple-pillars">
              <div class="pillar-item">
                <span class="pillar-title">WAKTU</span>
                <strong class="pillar-data">{{ formatDuration(rideForm.durationMinutes) }}</strong>
              </div>
              <div class="pillar-divider"></div>
              <div class="pillar-item">
                <span class="pillar-title">AVG SPEED</span>
                <strong class="pillar-data text-lime">{{ rideForm.avgSpeedKmH }} km/h</strong>
              </div>
              <div class="pillar-divider"></div>
              <div class="pillar-item">
                <span class="pillar-title">KALORI</span>
                <strong class="pillar-data text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
              </div>
            </div>
          </div>

          <!-- Provenance Stamp -->
          <div class="poster-inner-footer">
            <span>⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID</span>
          </div>
        </div>
      </div>

      <!-- 2. STUDIO TOOLS & CONTROLS -->
      <div class="studio-toolbox-panel">
        <!-- Segmented Tab Navigation -->
        <nav class="toolbox-tab-nav" aria-label="Toolbox Tabs">
          <button
            type="button"
            class="tab-nav-item"
            :class="{ active: activeTab === 'templates' }"
            @click="activeTab = 'templates'"
          >
            🎨 Template
          </button>
          <button
            type="button"
            class="tab-nav-item"
            :class="{ active: activeTab === 'backgrounds' }"
            @click="activeTab = 'backgrounds'"
          >
            🌄 Background
          </button>
          <button
            type="button"
            class="tab-nav-item"
            :class="{ active: activeTab === 'stickers' }"
            @click="activeTab = 'stickers'"
          >
            🏷️ Stiker
          </button>
          <button
            type="button"
            class="tab-nav-item"
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >
            ✨ AI Cerita
          </button>
          <button
            type="button"
            class="tab-nav-item"
            :class="{ active: activeTab === 'data' }"
            @click="activeTab = 'data'"
          >
            📊 Data
          </button>
        </nav>

        <!-- TAB 1: TEMPLATES -->
        <div v-show="activeTab === 'templates'" class="toolbox-content-card">
          <div class="toolbox-card-header">
            <h3>Pilih Gaya Template Poster</h3>
            <p>Pilih tema tipografi dan tata letak sesuai nuansa gowes Anda.</p>
          </div>
          <div class="template-cards-grid">
            <button
              type="button"
              class="style-choice-item"
              :class="{ active: rideForm.templateStyle === 'strava_bold' }"
              @click="rideForm.templateStyle = 'strava_bold'"
            >
              <span class="style-badge-pill">🔥 BOLD</span>
              <strong class="style-title">Strava Pro Neon</strong>
              <p class="style-subtitle">Tipografi kinetik tebal, angka besar kontras tinggi.</p>
            </button>
            <button
              type="button"
              class="style-choice-item"
              :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
              @click="rideForm.templateStyle = 'rapha_editorial'"
            >
              <span class="style-badge-pill">🏔️ CLASSIC</span>
              <strong class="style-title">Rapha Editorial</strong>
              <p class="style-subtitle">Nuansa majalah sepeda Eropa dengan koordinat GPS.</p>
            </button>
            <button
              type="button"
              class="style-choice-item"
              :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
              @click="rideForm.templateStyle = 'cyber_hud'"
            >
              <span class="style-badge-pill">⚡ CYBER</span>
              <strong class="style-title">Cyber Telemetry</strong>
              <p class="style-subtitle">Dashboard sensor digital cyan &amp; lime futuristik.</p>
            </button>
            <button
              type="button"
              class="style-choice-item"
              :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
              @click="rideForm.templateStyle = 'cafe_santai'"
            >
              <span class="style-badge-pill">☕ COFFEE</span>
              <strong class="style-title">Kopi &amp; Sate Maranggi</strong>
              <p class="style-subtitle">Nuansa hangat santai dengan callout kuliner lokal.</p>
            </button>
          </div>
        </div>

        <!-- TAB 2: BACKGROUNDS -->
        <div v-show="activeTab === 'backgrounds'" class="toolbox-content-card">
          <div class="toolbox-card-header">
            <h3>Pilihan Latar Belakang Estetis</h3>
            <p>Pilih palet panorama alam atau pasang foto jepretan Anda sendiri.</p>
          </div>
          <div class="bg-presets-grid">
            <button
              type="button"
              class="bg-preset-box bg-preset-box--alpine"
              :class="{ active: rideForm.bgPreset === 'alpine' }"
              @click="rideForm.bgPreset = 'alpine'"
            >
              <span class="preset-label">🏔️ Alpine Pass</span>
            </button>
            <button
              type="button"
              class="bg-preset-box bg-preset-box--gravel"
              :class="{ active: rideForm.bgPreset === 'gravel' }"
              @click="rideForm.bgPreset = 'gravel'"
            >
              <span class="preset-label">🌲 Gravel Pine</span>
            </button>
            <button
              type="button"
              class="bg-preset-box bg-preset-box--sunset"
              :class="{ active: rideForm.bgPreset === 'sunset' }"
              @click="rideForm.bgPreset = 'sunset'"
            >
              <span class="preset-label">🌅 Sunset Coast</span>
            </button>
            <button
              type="button"
              class="bg-preset-box bg-preset-box--crit"
              :class="{ active: rideForm.bgPreset === 'crit' }"
              @click="rideForm.bgPreset = 'crit'"
            >
              <span class="preset-label">⚡ Speed Crit</span>
            </button>
            <button
              type="button"
              class="bg-preset-box bg-preset-box--cafe"
              :class="{ active: rideForm.bgPreset === 'cafe' }"
              @click="rideForm.bgPreset = 'cafe'"
            >
              <span class="preset-label">☕ Coffee Stop</span>
            </button>
            <button
              type="button"
              class="bg-preset-box bg-preset-box--topo"
              :class="{ active: rideForm.bgPreset === 'topo' }"
              @click="rideForm.bgPreset = 'topo'"
            >
              <span class="preset-label">🗺️ Topo Neon</span>
            </button>
          </div>

          <!-- Custom Photo Upload CTA -->
          <label class="custom-photo-uploader">
            <input
              type="file"
              accept="image/*"
              class="sr-only"
              @change="handlePhotoUpload"
            />
            <span class="upload-icon">📸</span>
            <div class="upload-texts">
              <strong>Gunakan Foto Jepretan Sendiri</strong>
              <small>Ambil langsung dari galeri HP atau jepretan kamera</small>
            </div>
          </label>
        </div>

        <!-- TAB 3: STICKERS -->
        <div v-show="activeTab === 'stickers'" class="toolbox-content-card">
          <div class="toolbox-card-header">
            <h3>Stiker &amp; Badge Pencapaian</h3>
            <p>Sematkan lencana flexing di sudut kanan atas poster.</p>
          </div>
          <div class="sticker-grid-wrap">
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'kom' }"
              @click="rideForm.activeSticker = 'kom'"
            >
              <span class="s-icon">👑</span>
              <div class="s-info">
                <strong>KOM / PR Hunter</strong>
                <small>Raja Tanjakan &amp; Rekor Baru</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'cafe' }"
              @click="rideForm.activeSticker = 'cafe'"
            >
              <span class="s-icon">☕</span>
              <div class="s-info">
                <strong>Coffee Approved</strong>
                <small>Sesi Gowes Santai &amp; Ngopi</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'beast' }"
              @click="rideForm.activeSticker = 'beast'"
            >
              <span class="s-icon">⛰️</span>
              <div class="s-info">
                <strong>Climb Beast</strong>
                <small>Penakluk Elevasi Ekstrem</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'speed' }"
              @click="rideForm.activeSticker = 'speed'"
            >
              <span class="s-icon">⚡</span>
              <div class="s-info">
                <strong>Breakaway Pace</strong>
                <small>Kecepatan Rata-Rata Tinggi</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'fuel' }"
              @click="rideForm.activeSticker = 'fuel'"
            >
              <span class="s-icon">🍲</span>
              <div class="s-info">
                <strong>Sate Maranggi Fuel</strong>
                <small>Bakar Kalori Setara Kuliner</small>
              </div>
            </button>
            <button
              type="button"
              class="sticker-item-btn"
              :class="{ active: rideForm.activeSticker === 'none' }"
              @click="rideForm.activeSticker = 'none'"
            >
              <span class="s-icon">🚫</span>
              <div class="s-info">
                <strong>Tanpa Stiker</strong>
                <small>Tampilan Bersih &amp; Polos</small>
              </div>
            </button>
          </div>
        </div>

        <!-- TAB 4: AI STORYTELLER -->
        <div v-show="activeTab === 'ai'" class="toolbox-content-card">
          <div class="ai-strip-head">
            <div class="ai-strip-title">
              <span class="ai-spark-icon">✨</span>
              <div>
                <h4>Agentic AI Ride Storyteller</h4>
                <p>Caption media sosial cerdas &amp; analisa performa otomatis.</p>
              </div>
            </div>
            <button
              type="button"
              class="btn-magic-generate"
              :disabled="isAiGenerating"
              @click="generateAiStory"
            >
              <span>🪄</span>
              <span>{{ isAiGenerating ? 'Meracik AI...' : 'Generate Baru' }}</span>
            </button>
          </div>

          <!-- Culinary Fuel Banner -->
          <div class="culinary-box">
            <span class="culinary-tag">🍢 INDONESIAN CYCLING FUEL EQUIVALENCY</span>
            <strong class="culinary-val">{{ aiRecap.foodEquivalency }}</strong>
            <small class="culinary-sub">Membakar energi ~{{ rideForm.caloriesKcal }} kcal di tanjakan {{ aiRecap.climbGradeScore }}</small>
          </div>

          <!-- Persona Selector -->
          <div class="persona-deck">
            <button
              type="button"
              class="persona-btn"
              :class="{ active: selectedPersona === 'athlete' }"
              @click="selectedPersona = 'athlete'"
            >
              <span class="persona-ico">🏆</span>
              <div class="persona-desc">
                <strong>Gaya Atlet</strong>
                <small>Power &amp; Pacing</small>
              </div>
            </button>
            <button
              type="button"
              class="persona-btn"
              :class="{ active: selectedPersona === 'humor' }"
              @click="selectedPersona = 'humor'"
            >
              <span class="persona-ico">😂</span>
              <div class="persona-desc">
                <strong>Humor Santai</strong>
                <small>Niat Tipis Kopi</small>
              </div>
            </button>
            <button
              type="button"
              class="persona-btn"
              :class="{ active: selectedPersona === 'technical' }"
              @click="selectedPersona = 'technical'"
            >
              <span class="persona-ico">⚙️</span>
              <div class="persona-desc">
                <strong>Tech Geek</strong>
                <small>Drivetrain &amp; Spek</small>
              </div>
            </button>
          </div>

          <!-- Caption Preview -->
          <div class="caption-display-card">
            <p class="caption-body">{{ aiRecap.captions[selectedPersona] }}</p>
            <div class="caption-action-bar">
              <span class="caption-len">{{ aiRecap.captions[selectedPersona].length }} Karakter</span>
              <button
                type="button"
                class="btn-copy-caption"
                @click="copyCaption(aiRecap.captions[selectedPersona])"
              >
                📋 Salin Caption &amp; Tagar
              </button>
            </div>
          </div>

          <!-- Mechanic Advice -->
          <div class="mechanic-alert-card">
            <span class="m-icon">🔧</span>
            <p class="m-text">{{ aiRecap.mechanicTip }}</p>
          </div>
        </div>

        <!-- TAB 5: DATA INPUTS -->
        <div v-show="activeTab === 'data'" class="toolbox-content-card">
          <div class="toolbox-card-header">
            <h3>Sesuaikan Data Telemetri</h3>
            <p>Ubah angka untuk disesuaikan secara langsung pada poster.</p>
          </div>
          <div class="telemetry-form-grid">
            <div class="form-row">
              <label>Judul Sesi Gowes</label>
              <input v-model="rideForm.title" type="text" />
            </div>
            <div class="form-row">
              <label>Nama Sepeda</label>
              <input v-model="rideForm.bikeName" type="text" />
            </div>
            <div class="form-row">
              <label>Jarak Tempuh (km)</label>
              <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
            </div>
            <div class="form-row">
              <label>Elevasi Tanjakan (m)</label>
              <input v-model.number="rideForm.elevationM" type="number" />
            </div>
            <div class="form-row">
              <label>Durasi Total (Menit)</label>
              <input v-model.number="rideForm.durationMinutes" type="number" />
            </div>
            <div class="form-row">
              <label>Suhu Udara (°C)</label>
              <input v-model.number="rideForm.temperatureC" type="number" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Main Viewport Shell */
.creator-studio-viewport {
  min-height: 100vh;
  min-height: 100dvh;
  background: #080d19;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* 1. Header Navigation Bar */
.creator-studio-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: #050811;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 40;
  gap: 0.75rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.nav-back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 120ms ease;
}

.nav-back-button:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.nav-brand-lockup {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.brand-spark {
  color: var(--color-chain-lime);
  font-size: 1.15rem;
  flex-shrink: 0;
}

.brand-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-nav-download {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
  transition: all 120ms ease;
}

.btn-nav-download:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.btn-nav-share {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.95rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  font-size: 0.8rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
}

.btn-nav-share:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(201, 243, 106, 0.5);
}

@media (max-width: 520px) {
  .btn-text-full {
    display: none;
  }
}

/* 2. Ratio Selector Bar */
.studio-ratio-bar {
  background: #060a13;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: center;
}

.ratio-pills-wrap {
  display: flex;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem;
  border-radius: 0.75rem;
  max-width: 22rem;
  width: 100%;
}

.ratio-toggle-pill {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.4rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.ratio-toggle-pill.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* 3. Main Workspace Grid */
.creator-workspace {
  display: grid;
  grid-template-columns: 22rem 1fr;
  gap: 1.75rem;
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem 1.25rem 3rem;
  align-items: start;
}

@media (max-width: 860px) {
  .creator-workspace {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1rem 0.75rem 2.5rem;
  }
}

/* 4. POSTER DISPLAY STAGE */
.poster-display-stage {
  display: flex;
  justify-content: center;
  position: sticky;
  top: 6.5rem;
  z-index: 10;
}

.poster-canvas-frame {
  width: 100%;
  max-width: 20.5rem;
  aspect-ratio: 9 / 16;
  border-radius: 1.5rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(201, 243, 106, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  transition: all 180ms ease;
  background-size: cover;
  background-position: center;
}

@media (max-width: 860px) {
  .poster-canvas-frame {
    max-height: min(44vh, 320px);
    aspect-ratio: auto;
    height: 300px;
    padding: 1rem;
    border-radius: 1.25rem;
  }
}

.frame--post {
  aspect-ratio: 1 / 1 !important;
}

.frame--landscape {
  aspect-ratio: 16 / 9 !important;
}

/* Palette Presets for Canvas */
.bg--alpine {
  background: linear-gradient(180deg, rgba(8, 23, 38, 0.8) 0%, rgba(2, 6, 23, 0.96) 100%),
              radial-gradient(circle at 50% 15%, rgba(56, 189, 248, 0.3) 0%, transparent 60%),
              #0f2b48;
}

.bg--gravel {
  background: linear-gradient(180deg, rgba(10, 35, 20, 0.8) 0%, rgba(2, 10, 5, 0.96) 100%),
              radial-gradient(circle at 50% 15%, rgba(201, 243, 106, 0.25) 0%, transparent 60%),
              #143823;
}

.bg--sunset {
  background: linear-gradient(180deg, rgba(59, 13, 6, 0.8) 0%, rgba(15, 4, 2, 0.96) 100%),
              radial-gradient(circle at 50% 20%, rgba(251, 146, 60, 0.4) 0%, transparent 65%),
              #581c10;
}

.bg--crit {
  background: linear-gradient(180deg, rgba(33, 5, 51, 0.8) 0%, rgba(8, 1, 13, 0.96) 100%),
              radial-gradient(circle at 50% 15%, rgba(168, 85, 247, 0.35) 0%, transparent 60%),
              #3b1154;
}

.bg--cafe {
  background: linear-gradient(180deg, rgba(35, 17, 6, 0.8) 0%, rgba(13, 6, 2, 0.96) 100%),
              radial-gradient(circle at 50% 20%, rgba(217, 119, 6, 0.3) 0%, transparent 60%),
              #3d2111;
}

.bg--topo {
  background: linear-gradient(180deg, rgba(8, 13, 25, 0.8) 0%, rgba(3, 6, 10, 0.96) 100%),
              radial-gradient(circle at 50% 15%, rgba(201, 243, 106, 0.18) 0%, transparent 60%),
              #0c1527;
}

.topo-bg-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.6;
}

.poster-lighting-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 10, 18, 0.3) 0%,
    transparent 35%,
    rgba(6, 10, 18, 0.8) 75%,
    rgba(6, 10, 18, 0.98) 100%
  );
  z-index: 1;
}

/* Poster Inner Header */
.poster-inner-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.inner-brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.92);
  border: 1.5px solid var(--color-chain-lime);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
}

.badge-bolt {
  color: var(--color-chain-lime);
}

.inner-sticker-badge {
  padding: 0.25rem 0.7rem;
  border-radius: 9999px;
  background: var(--color-chain-lime);
  color: #080d19;
  font-size: 0.62rem;
  font-weight: 900;
  box-shadow: 0 3px 12px rgba(201, 243, 106, 0.4);
}

/* Poster Inner Hero */
.poster-inner-hero {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hero-mileage-lockup {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  line-height: 0.92;
}

.hero-mileage-number {
  font-family: var(--font-mono);
  font-size: 2.85rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: -0.05em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
}

.hero-mileage-suffix {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
}

.hero-session-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 850;
  color: #ffffff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-session-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  color: #cbd5e1;
}

/* Poster Inner Telemetry */
.poster-inner-telemetry {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.9);
  border: 1.5px solid rgba(201, 243, 106, 0.35);
  border-radius: 1rem;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  backdrop-filter: blur(12px);
}

.sparkline-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 850;
}

.sparkline-label {
  color: #94a3b8;
}

.sparkline-gain {
  color: #38bdf8;
}

.sparkline-svg {
  width: 100%;
  height: 1.35rem;
}

.telemetry-triple-pillars {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.45rem;
}

.pillar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.pillar-divider {
  width: 1px;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
}

.pillar-title {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  font-weight: 800;
  color: #94a3b8;
}

.pillar-data {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime { color: var(--color-chain-lime); }
.text-coral { color: #ff8c75; }

.poster-inner-footer {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 800;
  color: rgba(201, 243, 106, 0.8);
  margin-top: 0.3rem;
}

/* 5. TOOLBOX CONTROLS PANEL */
.studio-toolbox-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.toolbox-tab-nav {
  display: flex;
  gap: 0.35rem;
  background: #050811;
  padding: 0.35rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  scrollbar-width: none;
}

.toolbox-tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-nav-item {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.6rem 0.45rem;
  font-size: 0.78rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 120ms ease;
  white-space: nowrap;
}

.tab-nav-item.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.toolbox-content-card {
  background: #0c1426;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.35rem;
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

.toolbox-card-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  color: #ffffff;
}

.toolbox-card-header p {
  margin: 0.2rem 0 0;
  font-size: 0.76rem;
  color: #94a3b8;
}

/* Template Styles Grid */
.template-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (max-width: 580px) {
  .template-cards-grid {
    grid-template-columns: 1fr;
  }
}

.style-choice-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.style-choice-item:hover {
  border-color: rgba(201, 243, 106, 0.4);
}

.style-choice-item.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
  box-shadow: 0 0 18px rgba(201, 243, 106, 0.15);
}

.style-badge-pill {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.style-title {
  font-size: 0.9rem;
  font-weight: 850;
  color: #ffffff;
}

.style-subtitle {
  margin: 0;
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.35;
}

/* Background Presets */
.bg-presets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

@media (max-width: 580px) {
  .bg-presets-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.bg-preset-box {
  height: 4.8rem;
  border-radius: 0.85rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-end;
  padding: 0.45rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 120ms ease;
}

.bg-preset-box.active {
  border-color: var(--color-chain-lime);
  box-shadow: 0 0 15px rgba(201, 243, 106, 0.4);
}

.bg-preset-box--alpine {
  background: linear-gradient(135deg, #1e3a8a, #0f172a);
}

.bg-preset-box--gravel {
  background: linear-gradient(135deg, #14532d, #0f172a);
}

.bg-preset-box--sunset {
  background: linear-gradient(135deg, #9a3412, #0f172a);
}

.bg-preset-box--crit {
  background: linear-gradient(135deg, #6b21a8, #0b0f19);
}

.bg-preset-box--cafe {
  background: linear-gradient(135deg, #78350f, #0f172a);
}

.bg-preset-box--topo {
  background: linear-gradient(135deg, #0b1120, #020617);
}

.preset-label {
  position: relative;
  z-index: 1;
  font-size: 0.7rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.custom-photo-uploader {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.15rem;
  border-radius: 1rem;
  border: 2px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  cursor: pointer;
  transition: all 120ms ease;
}

.custom-photo-uploader:hover {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.upload-icon {
  font-size: 1.5rem;
}

.upload-texts strong {
  display: block;
  font-size: 0.84rem;
  color: var(--color-chain-lime);
}

.upload-texts small {
  font-size: 0.72rem;
  color: #94a3b8;
}

/* Sticker Grid */
.sticker-grid-wrap {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

@media (max-width: 580px) {
  .sticker-grid-wrap {
    grid-template-columns: 1fr;
  }
}

.sticker-item-btn {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.sticker-item-btn.active {
  background: rgba(201, 243, 106, 0.12);
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.s-icon {
  font-size: 1.35rem;
}

.s-info strong {
  display: block;
  font-size: 0.82rem;
  color: #ffffff;
}

.s-info small {
  font-size: 0.68rem;
  color: #94a3b8;
}

/* AI Storyteller Tab */
.ai-strip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

@media (max-width: 580px) {
  .ai-strip-head {
    flex-direction: column;
    align-items: stretch;
  }
}

.ai-strip-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-spark-icon {
  font-size: 1.5rem;
}

.ai-strip-title h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffffff;
}

.ai-strip-title p {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: #94a3b8;
}

.btn-magic-generate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.55rem 1rem;
  border-radius: 0.75rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  font-size: 0.8rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201, 243, 106, 0.35);
  transition: all 120ms ease;
  white-space: nowrap;
}

.btn-magic-generate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(201, 243, 106, 0.5);
}

.culinary-box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  border-radius: 0.85rem;
  background: rgba(255, 140, 117, 0.1);
  border: 1.5px solid rgba(255, 140, 117, 0.3);
}

.culinary-tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 900;
  color: #ff8c75;
}

.culinary-val {
  font-size: 0.92rem;
  color: #ffffff;
}

.culinary-sub {
  font-size: 0.72rem;
  color: #cbd5e1;
}

.persona-deck {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

@media (max-width: 580px) {
  .persona-deck {
    grid-template-columns: 1fr;
  }
}

.persona-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.85rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.persona-btn.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #ffffff;
}

.persona-ico {
  font-size: 1.25rem;
}

.persona-desc strong {
  display: block;
  font-size: 0.8rem;
  color: #ffffff;
}

.persona-desc small {
  font-size: 0.65rem;
  color: #94a3b8;
}

.caption-display-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(8, 13, 25, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.caption-body {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: #f1f5f9;
}

.caption-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.65rem;
}

.caption-len {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  color: #64748b;
}

.btn-copy-caption {
  background: rgba(201, 243, 106, 0.15);
  border: 1.5px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.4rem 0.85rem;
  border-radius: 0.65rem;
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 120ms ease;
}

.btn-copy-caption:hover {
  background: var(--color-chain-lime);
  color: #080d19;
}

.mechanic-alert-card {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.m-icon {
  font-size: 1rem;
}

.m-text {
  margin: 0;
  font-size: 0.76rem;
  color: #bae6fd;
  line-height: 1.4;
}

/* Telemetry Inputs */
.telemetry-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (max-width: 580px) {
  .telemetry-form-grid {
    grid-template-columns: 1fr;
  }
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row label {
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
}

.form-row input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  padding: 0.55rem 0.75rem;
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 750;
}

.form-row input:focus {
  outline: none;
  border-color: var(--color-chain-lime);
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
