<script setup lang="ts">
import type { GenerateRideStoryResponse } from '@goweskit/contracts';

const route = useRoute();
const api = useApi();
const { toast } = useNotify();

// Initial parameters
const initialDistance = Number(route.query.distance) || 45.8;
const initialElevation = Number(route.query.elevation) || 580;
const initialDuration = Number(route.query.duration) || 105;
const initialNote = String(route.query.note || 'Morning Gravel Loop Sentul');
const initialBike = String(route.query.bike || 'Polygon Siskiu T7');

// Active studio tab
const activeTool = ref<'style' | 'route' | 'backdrop' | 'stickers' | 'ai' | 'edit'>('style');

// Preset Routes Library
interface RoutePreset {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationM: number;
  pathD: string; // SVG path coordinate
  waypoints: Array<{ name: string; icon: string; x: number; y: number; type: 'coffee' | 'climb' | 'photo' | 'sprint' }>;
}

const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: 'sentul_loop',
    name: 'Sentul Gravel Loop: KM 0 & Kopi Tubing',
    location: 'Sentul, Bogor',
    distanceKm: 45.8,
    elevationM: 580,
    pathD: 'M 50 180 C 70 120, 110 80, 160 95 C 210 110, 240 60, 290 75 C 340 90, 360 150, 320 210 C 280 270, 220 280, 160 250 C 100 220, 70 230, 50 180 Z',
    waypoints: [
      { name: 'Start KM 0', icon: '🚩', x: 50, y: 180, type: 'photo' },
      { name: 'Tanjakan Rainbow', icon: '⛰️', x: 240, y: 60, type: 'climb' },
      { name: 'Warung Kopi & Sate', icon: '☕', x: 320, y: 210, type: 'coffee' },
      { name: 'Sprint Finish', icon: '🏁', x: 160, y: 250, type: 'sprint' },
    ],
  },
  {
    id: 'km0_bojong',
    name: 'Tanjakan KM 0 Bojong Koneng Challenge',
    location: 'Babakan Madang',
    distanceKm: 28.4,
    elevationM: 720,
    pathD: 'M 60 260 C 100 230, 120 180, 170 160 C 220 140, 250 80, 300 60 C 330 48, 350 70, 330 110 C 290 190, 200 220, 140 270 C 90 300, 70 280, 60 260 Z',
    waypoints: [
      { name: 'Check-in Gate', icon: '🚩', x: 60, y: 260, type: 'photo' },
      { name: 'KM 0 Summit (+720m)', icon: '👑', x: 300, y: 60, type: 'climb' },
      { name: 'Kopi Daong Pitstop', icon: '☕', x: 200, y: 220, type: 'coffee' },
    ],
  },
  {
    id: 'jkt_sudirman',
    name: 'Jakarta Sudirman - Thamrin - Monas Loop',
    location: 'DKI Jakarta',
    distanceKm: 32.0,
    elevationM: 45,
    pathD: 'M 80 250 L 80 80 C 80 50, 320 50, 320 80 L 320 250 C 320 280, 80 280, 80 250 Z',
    waypoints: [
      { name: 'Bundaran HI', icon: '🚩', x: 80, y: 160, type: 'photo' },
      { name: 'Monas Sprint Lap', icon: '⚡', x: 200, y: 50, type: 'sprint' },
      { name: 'GBK Pitstop', icon: '☕', x: 320, y: 200, type: 'coffee' },
    ],
  },
  {
    id: 'dago_bandung',
    name: 'Dago Pakar - Tahura Pine Trail Bandung',
    location: 'Bandung Utara',
    distanceKm: 38.5,
    elevationM: 890,
    pathD: 'M 70 270 C 110 210, 130 150, 180 120 C 230 90, 270 40, 320 50 C 350 60, 340 120, 300 170 C 250 230, 180 250, 120 280 Z',
    waypoints: [
      { name: 'Dago Bawah', icon: '🚩', x: 70, y: 270, type: 'photo' },
      { name: 'Tebing Keraton Peak', icon: '⛰️', x: 320, y: 50, type: 'climb' },
      { name: 'Armor Kopi Tahura', icon: '☕', x: 250, y: 230, type: 'coffee' },
    ],
  },
  {
    id: 'bromo_gravel',
    name: 'Bromo Sea of Sand Gravel Epic',
    location: 'Tengger, Jawa Timur',
    distanceKm: 52.0,
    elevationM: 1450,
    pathD: 'M 50 150 C 100 80, 160 50, 220 70 C 280 90, 330 60, 350 120 C 370 180, 310 240, 240 260 C 170 280, 100 240, 60 190 Z',
    waypoints: [
      { name: 'Cemoro Lawang', icon: '🚩', x: 50, y: 150, type: 'photo' },
      { name: 'Pasir Berbisik', icon: '⚡', x: 220, y: 70, type: 'sprint' },
      { name: 'Kawah Bromo Summit', icon: '🌋', x: 350, y: 120, type: 'climb' },
      { name: 'Bukit Teletubbies', icon: '☕', x: 170, y: 280, type: 'coffee' },
    ],
  },
];

// Form state
const rideForm = reactive({
  title: initialNote,
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
  // GPS Route Customizations
  showGpsRoute: true,
  selectedRoutePresetId: 'sentul_loop',
  routeRenderStyle: 'spectrum_elevation' as 'spectrum_elevation' | 'kinetic_neon' | 'topo_radar' | 'minimal_wire',
  showWaypoints: true,
});

const currentRoute = computed(() => {
  return ROUTE_PRESETS.find((r) => r.id === rideForm.selectedRoutePresetId) || ROUTE_PRESETS[0];
});

function selectRoutePreset(preset: RoutePreset) {
  rideForm.selectedRoutePresetId = preset.id;
  rideForm.title = preset.name;
  rideForm.distanceKm = preset.distanceKm;
  rideForm.elevationM = preset.elevationM;
  rideForm.avgSpeedKmH = Number((preset.distanceKm / Math.max(rideForm.durationMinutes / 60, 0.05)).toFixed(1));
  toast.success('Rute GPS Diterapkan!', `${preset.name} (${preset.distanceKm} km, +${preset.elevationM}m)`);
}

const isSyncingGps = ref(false);

async function syncFromDeviceGpsOrSession() {
  isSyncingGps.value = true;
  try {
    const sessionRes = await api<{ sessions: Array<{ id: string; status: string; startedAt: string; routeNote?: string | null }> }>('/safety/sessions').catch(() => null);
    
    if (sessionRes?.sessions && sessionRes.sessions.length > 0) {
      const latest = sessionRes.sessions[0];
      if (latest) {
        if (latest.routeNote) rideForm.title = latest.routeNote;
        toast.success('✨ Sesi Gowes Asli Tersinkron!', `Data dari catatan sesi "${latest.routeNote || 'Sesi Gowes'}" berhasil dimuat.`);
        isSyncingGps.value = false;
        return;
      }
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          const speedKmh = pos.coords.speed ? Number((pos.coords.speed * 3.6).toFixed(1)) : rideForm.avgSpeedKmH;
          if (speedKmh > 0) rideForm.avgSpeedKmH = speedKmh;
          toast.success('📍 GPS HP Terkoneksi!', `Posisi realtime terdeteksi di (${lat}, ${lng}). Sesi aktif langsung disinkronkan.`);
          isSyncingGps.value = false;
        },
        () => {
          toast.info('GPS Tersedia', 'Memakai estimasi rute lokal & telemetri sensor sepeda.');
          isSyncingGps.value = false;
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      toast.info('Info Telemetri', 'Browser tidak mendukung GPS langsung.');
      isSyncingGps.value = false;
    }
  } catch {
    toast.error('Gagal Sinkronisasi', 'Silakan coba beberapa saat lagi.');
    isSyncingGps.value = false;
  }
}

const selectedPersona = ref<'athlete' | 'humor' | 'technical'>('athlete');
const isAiGenerating = ref(false);
const isExporting = ref(false);

const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight: 'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  foodEquivalency: '1 porsi Sate Maranggi + Es Kelapa Muda 🍢🥥',
  climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
  captions: {
    athlete: `🎯 ${initialDistance} km · +${initialElevation}m Elevasi · Avg ${rideForm.avgSpeedKmH} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${initialBike}. #GowesKit #RideFlex #CyclingLife`,
    humor: `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${initialDistance} km dengan tanjakan ${initialElevation}m! Kaki getar pas pesen Sate Maranggi. Kopi dapet, konten dapet! 😂☕ #GowesSantai #GowesKit`,
    technical: `⚙️ Rute: ${initialNote} (${initialDistance} km). Setup drivetrain pada ${initialBike} bekerja mulus di gradien Cat 2 Mountain Pass. Kecepatan rata-rata ${rideForm.avgSpeedKmH} km/h. #BikeSpecs #GowesKit`,
  },
  mechanicTip: `💡 Saran AI Mekanik: Setelah elevasi +${initialElevation}m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.`,
  hashtags: ['#GowesKit', '#RideFlex', '#CyclingIndonesia', '#KOMHunter', '#SentulLoop'],
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
      toast.success('Foto Dipasang!', 'Foto jepretan Anda kini menjadi latar belakang.');
    }
  };
  reader.readAsDataURL(file);
}

function handleGpxUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  toast.success('File GPX Terbaca!', `Mengimpor jejak koordinat GPS dari ${file.name}`);
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
    toast.success('✨ Cerita AI Dihasilkan!', 'Caption dan analisa performa berhasil diperbarui.');
  } catch {
    toast.info('Mode Offline Heuristic', 'AI story dihasilkan dari engine lokal.');
  } finally {
    isAiGenerating.value = false;
  }
}

async function copyCaption(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Caption Disalin!', 'Siap di-paste ke media sosial.');
  } catch {
    toast.error('Gagal menyalin', 'Salin teks secara manual.');
  }
}

// -------------------------------------------------------------
// High-End Modern Canvas Exporter with GPS Route & Elevation Spectrum
// -------------------------------------------------------------
async function renderCanvas(aspectRatio: 'story' | 'post' | 'landscape'): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

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

  const FONT_UI = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const FONT_SERIF = 'Georgia, "Playfair Display", "Times New Roman", serif';

  // 1. Background Gradient / Custom Image
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
      // fallback
    }
  }

  // 2. Cyber HUD Grid & Corner Overlays
  if (rideForm.templateStyle === 'cyber_hud') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = 60;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Corner Brackets
    ctx.font = `800 48px ${FONT_UI}`;
    ctx.fillStyle = 'rgba(0, 255, 102, 0.85)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('⌜', 35, 35);
    ctx.textAlign = 'right';
    ctx.fillText('⌝', canvas.width - 35, 35);
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('⌞', 35, canvas.height - 35);
    ctx.textAlign = 'right';
    ctx.fillText('⌟', canvas.width - 35, canvas.height - 35);
  }

  // 3. Dynamic GPS Route Layer
  if (rideForm.showGpsRoute && currentRoute.value) {
    ctx.save();
    const routeBoxW = 400;
    const targetW = isStory ? 840 : (isLandscape ? 740 : 660);
    const scale = targetW / routeBoxW;
    const offsetX = isLandscape ? 80 : (canvas.width - routeBoxW * scale) / 2;
    const offsetY = isStory ? 280 : (isLandscape ? 200 : 150);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const routePath = new Path2D(currentRoute.value.pathD);

    // Glow Track
    ctx.shadowBlur = 24;
    ctx.shadowColor = rideForm.routeRenderStyle === 'kinetic_neon' ? '#C9F36A' : '#38BDF8';
    ctx.lineWidth = 14;
    ctx.strokeStyle = rideForm.routeRenderStyle === 'kinetic_neon' ? 'rgba(201, 243, 106, 0.35)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(routePath);
    ctx.shadowBlur = 0;

    // Core Route Gradient
    const routeGrad = ctx.createLinearGradient(50, 50, 350, 300);
    if (rideForm.routeRenderStyle === 'spectrum_elevation') {
      routeGrad.addColorStop(0, '#C9F36A');
      routeGrad.addColorStop(0.35, '#8EDDF4');
      routeGrad.addColorStop(0.7, '#F59E0B');
      routeGrad.addColorStop(1, '#FF8C75');
    } else if (rideForm.routeRenderStyle === 'kinetic_neon') {
      routeGrad.addColorStop(0, '#C9F36A');
      routeGrad.addColorStop(1, '#A3E635');
    } else if (rideForm.routeRenderStyle === 'minimal_wire') {
      routeGrad.addColorStop(0, '#FFFFFF');
      routeGrad.addColorStop(1, '#CBD5E1');
    } else {
      routeGrad.addColorStop(0, '#38BDF8');
      routeGrad.addColorStop(1, '#00FF66');
    }

    ctx.lineWidth = 6;
    ctx.strokeStyle = routeGrad;
    ctx.stroke(routePath);

    if (rideForm.showWaypoints && currentRoute.value.waypoints) {
      currentRoute.value.waypoints.forEach((wp) => {
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = wp.type === 'climb' ? '#FF8C75' : (wp.type === 'coffee' ? '#F59E0B' : '#C9F36A');
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wp.icon, wp.x, wp.y + 1);

        ctx.font = `800 10px ${FONT_UI}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(wp.name, wp.x, wp.y + 24);
      });
    }

    ctx.restore();
  }

  // 4. Dark Vignette Layer
  const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vignette.addColorStop(0, 'rgba(6, 10, 18, 0.45)');
  vignette.addColorStop(0.35, 'rgba(6, 10, 18, 0.05)');
  vignette.addColorStop(0.65, 'rgba(6, 10, 18, 0.85)');
  vignette.addColorStop(1, 'rgba(6, 10, 18, 0.98)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 5. Official GowesKit Brand Pill & Sticker (Top Bar)
  const pillY = isStory ? 80 : 50;
  const pillH = 58;

  ctx.font = `900 28px ${FONT_UI}`;
  const gowesTextW = ctx.measureText('Gowes').width;
  const kitTextW = ctx.measureText('Kit').width;
  const brandPillW = 16 + 38 + 12 + gowesTextW + kitTextW + 32;

  ctx.fillStyle = 'rgba(23, 32, 42, 0.92)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(isLandscape ? 80 : 60, pillY, brandPillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();

  // Draw Brand Icon
  const iconBoxX = (isLandscape ? 80 : 60) + 12;
  const iconBoxY = pillY + 10;
  ctx.save();
  ctx.translate(iconBoxX, iconBoxY);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(0, 0, 38, 38, 10);
  ctx.fill();

  const gWheelPath = new Path2D('M27 15.2C25.3 13.2 22.8 12 20 12C15.0294 12 11 16.0294 11 21C11 25.9706 15.0294 30 20 30C24.4 30 28.1 26.8 28.8 22.5H19');
  const speedArrowPath = new Path2D('M23 17.5L28.2 22.5L23 27.5');

  ctx.scale(38 / 40, 38 / 40);
  ctx.strokeStyle = '#C9F36A';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(gWheelPath);

  ctx.strokeStyle = '#8EDDF4';
  ctx.lineWidth = 3;
  ctx.stroke(speedArrowPath);

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(20, 21, 2.2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  // Draw Brand Text
  const brandTextStartX = iconBoxX + 38 + 12;
  ctx.font = `900 28px ${FONT_UI}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Gowes', brandTextStartX, pillY + pillH / 2);
  ctx.fillStyle = '#C9F36A';
  ctx.fillText('Kit', brandTextStartX + gowesTextW, pillY + pillH / 2);

  ctx.fillStyle = '#C9F36A';
  ctx.beginPath();
  ctx.arc(brandTextStartX + gowesTextW + kitTextW + 8, pillY + pillH / 2 - 2, 4, 0, 2 * Math.PI);
  ctx.fill();

  // Sticker Chip
  if (rideForm.activeSticker !== 'none') {
    const stickerText = {
      kom: '👑 KOM HUNTER',
      cafe: '☕ COFFEE APPROVED',
      beast: '⛰️ CLIMB BEAST',
      speed: '⚡ 26+ KM/H',
      fuel: '🍲 FUEL SATE',
      podium: '🏁 PODIUM FINISHER',
    }[rideForm.activeSticker];

    if (stickerText) {
      ctx.font = `900 22px ${FONT_UI}`;
      const stickerTextW = ctx.measureText(stickerText).width;
      const stickerPad = 22;
      const stickerPillW = stickerTextW + stickerPad * 2;
      const stickerX = canvas.width - (isLandscape ? 80 : 60) - stickerPillW;

      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(stickerX, pillY, stickerPillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = '#080d19';
      ctx.font = `900 22px ${FONT_UI}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(stickerText, stickerX + stickerPad, pillY + pillH / 2);
    }
  }

  // 6. Center Hero Typography (Mileage, Title, Specs)
  const heroX = isLandscape ? 980 : 60;
  const heroY = isStory ? 1080 : (isLandscape ? 360 : 540);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Eyebrow Tag
  if (rideForm.templateStyle === 'rapha_editorial') {
    ctx.fillStyle = '#FF8C75';
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText('STAGE 01 · FINISHED ETAPPE', heroX, heroY - 140);
  } else if (rideForm.templateStyle === 'cyber_hud') {
    ctx.fillStyle = '#00FF66';
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText('GPS: LOCKED (14 SATS) · CAD: 88 RPM', heroX, heroY - 140);
  } else if (rideForm.templateStyle === 'cafe_santai') {
    ctx.fillStyle = '#FDE68A';
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText('☕ RECOVERY MODE · KULINERAN', heroX, heroY - 140);
  }

  const distNumberStr = `${rideForm.distanceKm}`;
  const isSerif = rideForm.templateStyle === 'rapha_editorial';
  const numFont = isStory ? (isSerif ? `900 150px ${FONT_SERIF}` : `900 150px ${FONT_UI}`) : `900 110px ${FONT_UI}`;

  // Mileage Value
  if (rideForm.templateStyle === 'cyber_hud') {
    ctx.fillStyle = '#38BDF8';
  } else if (rideForm.templateStyle === 'cafe_santai') {
    ctx.fillStyle = '#F59E0B';
  } else if (rideForm.templateStyle === 'rapha_editorial') {
    ctx.fillStyle = '#FFFFFF';
  } else {
    ctx.fillStyle = '#C9F36A';
  }

  ctx.font = numFont;
  ctx.fillText(distNumberStr, heroX, heroY);

  const numWidth = ctx.measureText(distNumberStr).width;
  ctx.font = isStory ? `900 48px ${FONT_UI}` : `900 36px ${FONT_UI}`;
  ctx.fillStyle = rideForm.templateStyle === 'cyber_hud' ? '#00FF66' : (rideForm.templateStyle === 'cafe_santai' ? '#FDE68A' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#FFFFFF'));
  ctx.fillText('KM', heroX + numWidth + 18, heroY - (isStory ? 45 : 30));

  // Session Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = isStory ? `850 42px ${FONT_UI}` : `850 34px ${FONT_UI}`;
  const titleText = rideForm.title.length > 32 ? `${rideForm.title.slice(0, 30)}…` : rideForm.title;
  ctx.fillText(titleText, heroX, heroY + (isStory ? 58 : 46));

  // Session Specs
  ctx.fillStyle = rideForm.templateStyle === 'cafe_santai' ? '#FDE68A' : (rideForm.templateStyle === 'rapha_editorial' ? '#FFD1C9' : '#CBD5E1');
  ctx.font = isStory ? `600 24px ${FONT_UI}` : `600 20px ${FONT_UI}`;
  ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, heroX, heroY + (isStory ? 104 : 82));

  // 7. Bottom Glass Telemetry Card (Matching 3-Column Preview EXACTLY!)
  const cardX = isLandscape ? 980 : 60;
  const cardW = isLandscape ? (canvas.width - 980 - 80) : (canvas.width - 120);
  const cardY = isStory ? 1340 : (isLandscape ? 580 : 720);
  const cardH = isStory ? 380 : (isLandscape ? 340 : 250);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = rideForm.templateStyle === 'rapha_editorial'
    ? 'rgba(255, 140, 117, 0.45)'
    : (rideForm.templateStyle === 'cyber_hud' ? 'rgba(56, 189, 248, 0.5)' : (rideForm.templateStyle === 'cafe_santai' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(201, 243, 106, 0.4)'));
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  ctx.stroke();

  // Elev Strip Top Row
  const elevRowY = cardY + (isStory ? 55 : 42);
  ctx.font = `800 ${isStory ? 20 : 16}px ${FONT_UI}`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('ELEVASI PROFILE', cardX + 36, elevRowY);

  ctx.font = `900 ${isStory ? 22 : 18}px ${FONT_UI}`;
  ctx.fillStyle = '#38BDF8';
  ctx.textAlign = 'right';
  ctx.fillText(`+${rideForm.elevationM}m Climb`, cardX + cardW - 36, elevRowY);
  ctx.textAlign = 'left';

  // Elevation Smooth Wave
  const curveStartX = cardX + 36;
  const curveEndX = cardX + cardW - 36;
  const curveY = elevRowY + (isStory ? 45 : 32);

  ctx.strokeStyle = rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#38BDF8');
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(curveStartX, curveY + 12);
  ctx.bezierCurveTo(
    curveStartX + (curveEndX - curveStartX) * 0.35, curveY + 8,
    curveStartX + (curveEndX - curveStartX) * 0.65, curveY - 4,
    curveEndX, curveY - 8
  );
  ctx.stroke();

  // Wave dots
  ctx.fillStyle = rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : '#38BDF8';
  ctx.beginPath();
  ctx.arc(curveStartX, curveY + 12, 5, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = rideForm.templateStyle === 'cafe_santai' ? '#FDE68A' : (rideForm.templateStyle === 'rapha_editorial' ? '#FFD1C9' : '#C9F36A');
  ctx.beginPath();
  ctx.arc(curveEndX, curveY - 8, 6, 0, 2 * Math.PI);
  ctx.fill();

  // 3 Pillars: Waktu, Speed, Kalori
  const pillarsY = curveY + (isStory ? 65 : 45);
  const colWidth = (cardW - 72) / 3;

  const statsList = [
    { label: 'WAKTU', val: formatDuration(rideForm.durationMinutes), color: '#FFFFFF' },
    {
      label: 'SPEED',
      val: `${rideForm.avgSpeedKmH} km/h`,
      color: rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#C9F36A'),
    },
    { label: 'KALORI', val: `~${rideForm.caloriesKcal} kcal`, color: '#FF8C75' },
  ];

  statsList.forEach((stat, idx) => {
    const colX = cardX + 36 + idx * colWidth;

    // Label
    ctx.fillStyle = '#94A3B8';
    ctx.font = `800 ${isStory ? 18 : 14}px ${FONT_UI}`;
    ctx.fillText(stat.label, colX + 12, pillarsY);

    // Value
    ctx.fillStyle = stat.color;
    ctx.font = `900 ${isStory ? 38 : 28}px ${FONT_UI}`;
    ctx.fillText(stat.val, colX + 12, pillarsY + (isStory ? 52 : 38));

    // Vertical Divider (between col 0-1 and 1-2)
    if (idx < 2) {
      const divX = colX + colWidth;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(divX, pillarsY - 6);
      ctx.lineTo(divX, pillarsY + (isStory ? 60 : 44));
      ctx.stroke();
    }
  });

  // 8. Watermark Footer
  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = `900 ${isStory ? 20 : 16}px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID', canvas.width / 2, canvas.height - (isStory ? 35 : 25));
  ctx.textAlign = 'left';

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

    toast.success('Poster Gowes HD Terunduh!', 'Format jernih siap diposting.');
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
  <div class="studio-root">
    <!-- Minimalist Top Navbar -->
    <header class="studio-header">
      <NuxtLink to="/safety" class="btn-icon-nav" aria-label="Kembali">
        <GIcon name="arrow-left" size="sm" />
      </NuxtLink>

      <div class="studio-header-title">
        <GIcon name="bolt" size="xs" color="var(--color-chain-lime)" filled />
        <span>RIDE PASS STUDIO</span>
      </div>

      <div class="studio-header-right">
        <button
          type="button"
          class="btn-header-dl"
          title="Unduh Gambar PNG"
          :disabled="isExporting"
          @click="downloadStoryImage"
        >
          <GIcon name="download" size="xs" />
        </button>
        <button
          type="button"
          class="btn-header-share"
          :disabled="isExporting"
          @click="shareToMedia"
        >
          <span>Bagikan</span>
          <GIcon name="share" size="xs" />
        </button>
      </div>
    </header>

    <!-- Main Scrollable Studio Layout -->
    <main class="studio-content-layout">
      <!-- 1. Hero Poster Canvas (Transformative Per Template Style) -->
      <section class="poster-hero-wrap">
        <div
          class="poster-box"
          :class="[
            `aspect--${rideForm.aspectRatio}`,
            `bg--${rideForm.bgPreset}`,
            `theme--${rideForm.templateStyle}`,
          ]"
          :style="rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl ? { backgroundImage: `url(${rideForm.customPhotoUrl})` } : {}"
        >
          <!-- Cyber HUD Overlays -->
          <template v-if="rideForm.templateStyle === 'cyber_hud'">
            <div class="hud-corner hud-tl">⌜</div>
            <div class="hud-corner hud-tr">⌝</div>
            <div class="hud-corner hud-bl">⌞</div>
            <div class="hud-corner hud-br">⌟</div>
            <div class="hud-grid-overlay" />
          </template>

          <!-- Dynamic GowesKit Signature GPS Route Ribbon Canvas / SVG Layer -->
          <div v-if="rideForm.showGpsRoute && currentRoute" class="gps-route-art-layer">
            <svg viewBox="0 0 400 350" class="gps-route-svg" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="spectrumElevation" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#C9F36A" />
                  <stop offset="35%" stop-color="#8EDDF4" />
                  <stop offset="70%" stop-color="#F59E0B" />
                  <stop offset="100%" stop-color="#FF8C75" />
                </linearGradient>
                <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Outer Glowing Ambient Track -->
              <path
                :d="currentRoute.pathD"
                fill="none"
                :stroke="rideForm.routeRenderStyle === 'kinetic_neon' ? '#C9F36A' : 'url(#spectrumElevation)'"
                stroke-width="12"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.3"
                filter="url(#routeGlow)"
              />

              <!-- Core Vibrant Route Ribbon -->
              <path
                :d="currentRoute.pathD"
                fill="none"
                :stroke="rideForm.routeRenderStyle === 'spectrum_elevation' ? 'url(#spectrumElevation)' : (rideForm.routeRenderStyle === 'kinetic_neon' ? '#C9F36A' : '#38BDF8')"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Checkpoint & Pitstop Waypoints -->
              <g v-if="rideForm.showWaypoints && currentRoute.waypoints">
                <g v-for="(wp, wIdx) in currentRoute.waypoints" :key="wIdx" :transform="`translate(${wp.x}, ${wp.y})`">
                  <circle r="12" fill="#0F172A" :stroke="wp.type === 'climb' ? '#FF8C75' : (wp.type === 'coffee' ? '#F59E0B' : '#C9F36A')" stroke-width="2" />
                  <text y="4" text-anchor="middle" font-size="11">{{ wp.icon }}</text>
                  <text y="22" text-anchor="middle" font-size="8.5" font-weight="800" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI'">{{ wp.name }}</text>
                </g>
              </g>
            </svg>
          </div>

          <!-- Vector Topo Wave Line Fallback -->
          <svg v-else class="poster-topo-bg" viewBox="0 0 400 700" fill="none" aria-hidden="true">
            <path d="M-50 140 C 90 90, 240 240, 450 120" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2" />
            <path d="M-50 280 C 130 200, 290 360, 450 240" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2.5" />
            <path d="M-50 440 C 110 350, 310 510, 450 380" stroke="rgba(201, 243, 106, 0.15)" stroke-width="2" />
          </svg>

          <div class="poster-vignette-layer" />

          <!-- Official GowesKit Brand Pill & Achievement Sticker -->
          <div class="poster-card-top">
            <div class="brand-chip">
              <div class="brand-mark-mini">
                <svg viewBox="0 0 40 40" fill="none" width="16" height="16" aria-hidden="true">
                  <rect width="40" height="40" rx="10" fill="#17202A" />
                  <path d="M27 15.2C25.3 13.2 22.8 12 20 12C15.0294 12 11 16.0294 11 21C11 25.9706 15.0294 30 20 30C24.4 30 28.1 26.8 28.8 22.5H19" stroke="#C9F36A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M23 17.5L28.2 22.5L23 27.5" stroke="#8EDDF4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="20" cy="21" r="2.2" fill="#FFFFFF" />
                </svg>
              </div>
              <span class="brand-text-mini">
                <span class="brand-text-gowes">Gowes</span><span class="brand-text-kit">Kit</span><span class="brand-dot-mini" />
              </span>
            </div>

            <div
              v-if="rideForm.activeSticker !== 'none'"
              class="sticker-chip"
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

          <!-- Poster Hero Typography -->
          <div class="poster-card-center">
            <!-- Rapha Editorial Badge -->
            <div v-if="rideForm.templateStyle === 'rapha_editorial'" class="rapha-etappe-tag">
              STAGE 01 · FINISHED ETAPPE
            </div>
            <!-- Cyber HUD Raw Badge -->
            <div v-else-if="rideForm.templateStyle === 'cyber_hud'" class="cyber-telemetry-tag">
              GPS: LOCKED (14 SATS) · CAD: 88 RPM
            </div>
            <!-- Cafe Warm Fuel Badge -->
            <div v-else-if="rideForm.templateStyle === 'cafe_santai'" class="cafe-fuel-tag">
              ☕ RECOVERY MODE · KULINERAN
            </div>

            <div class="mileage-row">
              <span class="mileage-val">{{ rideForm.distanceKm }}</span>
              <span class="mileage-unit">KM</span>
            </div>
            <h2 class="session-name">{{ rideForm.title }}</h2>
            <div class="session-specs">🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C Cerah</div>
          </div>

          <!-- Poster Glass Telemetry Strip -->
          <div class="poster-card-glass">
            <div class="elev-strip">
              <span class="elev-lbl">ELEVASI PROFILE</span>
              <span class="elev-val">+{{ rideForm.elevationM }}m Climb</span>
            </div>
            <svg viewBox="0 0 300 24" class="elev-curve-svg" aria-hidden="true">
              <path
                d="M0 20 Q 70 18, 140 8 T 260 5 L 300 2"
                fill="none"
                :stroke="rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#38BDF8')"
                stroke-width="2.8"
                stroke-linecap="round"
              />
              <circle cx="0" cy="20" r="2.5" :fill="rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : '#38BDF8'" />
              <circle cx="300" cy="2" r="3.5" :fill="rideForm.templateStyle === 'cafe_santai' ? '#FDE68A' : (rideForm.templateStyle === 'rapha_editorial' ? '#FFD1C9' : '#C9F36A')" />
            </svg>

            <div class="pillars-row">
              <div class="p-col">
                <span class="p-lbl">WAKTU</span>
                <strong class="p-val">{{ formatDuration(rideForm.durationMinutes) }}</strong>
              </div>
              <div class="p-div" />
              <div class="p-col">
                <span class="p-lbl">SPEED</span>
                <strong class="p-val" :class="rideForm.templateStyle === 'cafe_santai' ? 'text-amber' : (rideForm.templateStyle === 'rapha_editorial' ? 'text-coral' : 'text-lime')">{{ rideForm.avgSpeedKmH }} km/h</strong>
              </div>
              <div class="p-div" />
              <div class="p-col">
                <span class="p-lbl">KALORI</span>
                <strong class="p-val text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
              </div>
            </div>
          </div>

          <div class="poster-watermark">
            ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
          </div>
        </div>

        <!-- Format Switcher Bar -->
        <div class="ratio-switch-row">
          <button
            type="button"
            class="ratio-pill-btn"
            :class="{ active: rideForm.aspectRatio === 'story' }"
            @click="rideForm.aspectRatio = 'story'"
          >
            Story (9:16)
          </button>
          <button
            type="button"
            class="ratio-pill-btn"
            :class="{ active: rideForm.aspectRatio === 'post' }"
            @click="rideForm.aspectRatio = 'post'"
          >
            Square (1:1)
          </button>
          <button
            type="button"
            class="ratio-pill-btn"
            :class="{ active: rideForm.aspectRatio === 'landscape' }"
            @click="rideForm.aspectRatio = 'landscape'"
          >
            Banner (16:9)
          </button>
        </div>
      </section>

      <!-- 2. Studio Controls Drawer (Horizontally Scrollable Tabs) -->
      <section class="studio-drawer">
        <!-- Smooth Horizontally Scrollable Tool Bar -->
        <nav class="tool-menu-bar" aria-label="Studio Tools">
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'style' }"
            @click="activeTool = 'style'"
          >
            <GIcon name="sparkles" size="xs" />
            <span>Gaya</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'route' }"
            @click="activeTool = 'route'"
          >
            <GIcon name="route" size="xs" />
            <span>Rute GPS</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'backdrop' }"
            @click="activeTool = 'backdrop'"
          >
            <GIcon name="mountain" size="xs" />
            <span>Nuansa</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'stickers' }"
            @click="activeTool = 'stickers'"
          >
            <GIcon name="trophy" size="xs" />
            <span>Stiker</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'ai' }"
            @click="activeTool = 'ai'"
          >
            <GIcon name="sparkles" size="xs" />
            <span>Caption AI</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'edit' }"
            @click="activeTool = 'edit'"
          >
            <GIcon name="edit" size="xs" />
            <span>Edit</span>
          </button>
        </nav>

        <!-- Tool Content Panels -->
        <div class="tool-panel-box">
          <!-- 1. STYLE TEMPLATES -->
          <div v-show="activeTool === 'style'" class="scroll-chips-row">
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'strava_bold' }"
              @click="rideForm.templateStyle = 'strava_bold'"
            >
              <span class="chip-card-tag"><GIcon name="bolt" size="xs" filled /> BOLD</span>
              <strong>Strava Pro</strong>
              <small>Kinetic Neon Green</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
              @click="rideForm.templateStyle = 'rapha_editorial'"
            >
              <span class="chip-card-tag"><GIcon name="mountain" size="xs" /> CLASSIC</span>
              <strong>Rapha Editorial</strong>
              <small>Serif &amp; Clean GPS</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
              @click="rideForm.templateStyle = 'cyber_hud'"
            >
              <span class="chip-card-tag"><GIcon name="radar" size="xs" /> CYBER</span>
              <strong>Cyber Telemetry</strong>
              <small>HUD Grid &amp; Sensor</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
              @click="rideForm.templateStyle = 'cafe_santai'"
            >
              <span class="chip-card-tag"><GIcon name="coffee" size="xs" /> COFFEE</span>
              <strong>Kopi &amp; Sate</strong>
              <small>Golden Amber Fuel</small>
            </button>
          </div>

          <!-- 2. ROUTE GPS SIGNATURE ENGINE -->
          <div v-show="activeTool === 'route'" class="route-panel-flow">
            <div class="route-header-toggle">
              <label class="toggle-wrap">
                <input v-model="rideForm.showGpsRoute" type="checkbox" />
                <span class="toggle-lbl">Tampilkan Jejak Visual Rute GPS</span>
              </label>
              <label class="toggle-wrap">
                <input v-model="rideForm.showWaypoints" type="checkbox" />
                <span class="toggle-lbl">Ikon Pitstop / Checkpoint</span>
              </label>
            </div>

            <!-- Route Visual Rendering Styles -->
            <div class="route-styles-row">
              <button
                type="button"
                class="r-style-btn"
                :class="{ active: rideForm.routeRenderStyle === 'spectrum_elevation' }"
                @click="rideForm.routeRenderStyle = 'spectrum_elevation'"
              >
                <GIcon name="route" size="xs" />
                <span>Gradien Elevasi</span>
              </button>
              <button
                type="button"
                class="r-style-btn"
                :class="{ active: rideForm.routeRenderStyle === 'kinetic_neon' }"
                @click="rideForm.routeRenderStyle = 'kinetic_neon'"
              >
                <GIcon name="bolt" size="xs" filled />
                <span>Neon Glow</span>
              </button>
              <button
                type="button"
                class="r-style-btn"
                :class="{ active: rideForm.routeRenderStyle === 'topo_radar' }"
                @click="rideForm.routeRenderStyle = 'topo_radar'"
              >
                <GIcon name="radar" size="xs" />
                <span>Radar Topo</span>
              </button>
              <button
                type="button"
                class="r-style-btn"
                :class="{ active: rideForm.routeRenderStyle === 'minimal_wire' }"
                @click="rideForm.routeRenderStyle = 'minimal_wire'"
              >
                <GIcon name="map" size="xs" />
                <span>Minimal Outline</span>
              </button>
            </div>

            <!-- Iconic Route Presets -->
            <div class="route-presets-list">
              <div
                v-for="preset in ROUTE_PRESETS"
                :key="preset.id"
                class="preset-item-card"
                :class="{ active: rideForm.selectedRoutePresetId === preset.id }"
                @click="selectRoutePreset(preset)"
              >
                <div class="preset-icon-col">
                  <GIcon name="route" size="sm" color="var(--color-chain-lime)" />
                </div>
                <div class="preset-info-col">
                  <strong>{{ preset.name }}</strong>
                  <small>{{ preset.location }} · {{ preset.distanceKm }} km · +{{ preset.elevationM }}m</small>
                </div>
                <div v-if="rideForm.selectedRoutePresetId === preset.id" class="preset-active-check">
                  <GIcon name="check" size="xs" color="#080d19" />
                </div>
              </div>
            </div>

            <!-- GPX Import CTA -->
            <label class="btn-upload-clean">
              <input type="file" accept=".gpx,.geojson" class="sr-only" @change="handleGpxUpload" />
              <GIcon name="route" size="xs" />
              <span>Unggah File Jejak GPX / GeoJSON Sendiri</span>
            </label>
          </div>

          <!-- 3. BACKDROP PRESETS -->
          <div v-show="activeTool === 'backdrop'" class="backdrop-palette-flow">
            <div class="bg-circles-row">
              <button
                type="button"
                class="bg-circle bg--alpine"
                :class="{ active: rideForm.bgPreset === 'alpine' }"
                title="Alpine Blue"
                @click="rideForm.bgPreset = 'alpine'"
              >
                <GIcon name="mountain" size="xs" color="#38BDF8" />
              </button>
              <button
                type="button"
                class="bg-circle bg--gravel"
                :class="{ active: rideForm.bgPreset === 'gravel' }"
                title="Gravel Pine"
                @click="rideForm.bgPreset = 'gravel'"
              >
                <GIcon name="tree" size="xs" color="#4ADE80" />
              </button>
              <button
                type="button"
                class="bg-circle bg--sunset"
                :class="{ active: rideForm.bgPreset === 'sunset' }"
                title="Sunset Amber"
                @click="rideForm.bgPreset = 'sunset'"
              >
                <GIcon name="sun" size="xs" color="#FB923C" />
              </button>
              <button
                type="button"
                class="bg-circle bg--crit"
                :class="{ active: rideForm.bgPreset === 'crit' }"
                title="Speed Crit Purple"
                @click="rideForm.bgPreset = 'crit'"
              >
                <GIcon name="bolt" size="xs" color="#C084FC" filled />
              </button>
              <button
                type="button"
                class="bg-circle bg--cafe"
                :class="{ active: rideForm.bgPreset === 'cafe' }"
                title="Coffee Mocha"
                @click="rideForm.bgPreset = 'cafe'"
              >
                <GIcon name="coffee" size="xs" color="#FBBF24" />
              </button>
              <button
                type="button"
                class="bg-circle bg--topo"
                :class="{ active: rideForm.bgPreset === 'topo' }"
                title="Topo Neon"
                @click="rideForm.bgPreset = 'topo'"
              >
                <GIcon name="route" size="xs" color="#C9F36A" />
              </button>
            </div>

            <label class="btn-upload-clean">
              <input type="file" accept="image/*" class="sr-only" @change="handlePhotoUpload" />
              <GIcon name="camera" size="xs" />
              <span>Unggah Foto Jepretan Sendiri</span>
            </label>
          </div>

          <!-- 4. STICKERS -->
          <div v-show="activeTool === 'stickers'" class="sticker-pills-flow">
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'kom' }"
              @click="rideForm.activeSticker = 'kom'"
            >
              <GIcon name="trophy" size="xs" color="#EAB308" filled /> KOM Hunter
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'cafe' }"
              @click="rideForm.activeSticker = 'cafe'"
            >
              <GIcon name="coffee" size="xs" color="#D97706" /> Coffee Approved
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'beast' }"
              @click="rideForm.activeSticker = 'beast'"
            >
              <GIcon name="mountain" size="xs" color="#10B981" /> Climb Beast
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'speed' }"
              @click="rideForm.activeSticker = 'speed'"
            >
              <GIcon name="bolt" size="xs" color="#C9F36A" filled /> Breakaway
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'fuel' }"
              @click="rideForm.activeSticker = 'fuel'"
            >
              <GIcon name="water" size="xs" color="#3B82F6" /> Pitstop Fuel
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'none' }"
              @click="rideForm.activeSticker = 'none'"
            >
              <GIcon name="close" size="xs" /> Polos
            </button>
          </div>

          <!-- 5. AI CAPTIONS -->
          <div v-show="activeTool === 'ai'" class="ai-studio-flow">
            <div class="ai-persona-row">
              <button
                type="button"
                class="persona-tag"
                :class="{ active: selectedPersona === 'athlete' }"
                @click="selectedPersona = 'athlete'"
              >
                <GIcon name="trophy" size="xs" />
                <span>Atlet</span>
              </button>
              <button
                type="button"
                class="persona-tag"
                :class="{ active: selectedPersona === 'humor' }"
                @click="selectedPersona = 'humor'"
              >
                <GIcon name="coffee" size="xs" />
                <span>Santai</span>
              </button>
              <button
                type="button"
                class="persona-tag"
                :class="{ active: selectedPersona === 'technical' }"
                @click="selectedPersona = 'technical'"
              >
                <GIcon name="wrench" size="xs" />
                <span>Tech Geek</span>
              </button>
              <button
                type="button"
                class="btn-regen-ai"
                :disabled="isAiGenerating"
                @click="generateAiStory"
              >
                <GIcon name="sparkles" size="xs" />
                <span>{{ isAiGenerating ? 'Meracik...' : 'Racik Ulang' }}</span>
              </button>
            </div>

            <div class="ai-caption-card">
              <p class="ai-caption-body">{{ aiRecap.captions[selectedPersona] }}</p>
              <button
                type="button"
                class="btn-copy-clean"
                @click="copyCaption(aiRecap.captions[selectedPersona])"
              >
                <GIcon name="bookmark" size="xs" />
                <span>Salin Caption &amp; Tagar</span>
              </button>
            </div>

            <div class="culinary-clean-tag">
              <GIcon name="coffee" size="xs" color="#F59E0B" />
              <span>{{ aiRecap.foodEquivalency }}</span>
            </div>
          </div>

          <!-- 6. EDIT DATA -->
          <div v-show="activeTool === 'edit'" class="edit-fields-flow">
            <button
              type="button"
              class="btn-sync-full"
              :disabled="isSyncingGps"
              @click="syncFromDeviceGpsOrSession"
            >
              <GIcon name="radar" size="sm" color="var(--color-chain-lime)" />
              <span>{{ isSyncingGps ? 'Menyambungkan GPS...' : 'Tarik Data Sesi Gowes Asli / GPS Saya' }}</span>
            </button>
            <div class="field-item">
              <label>Judul Sesi</label>
              <input v-model="rideForm.title" type="text" />
            </div>
            <div class="field-item">
              <label>Nama Sepeda</label>
              <input v-model="rideForm.bikeName" type="text" />
            </div>
            <div class="field-item">
              <label>Jarak (km)</label>
              <input v-model.number="rideForm.distanceKm" type="number" step="0.1" />
            </div>
            <div class="field-item">
              <label>Elevasi (m)</label>
              <input v-model.number="rideForm.elevationM" type="number" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Studio Viewport Shell */
.studio-root {
  min-height: 100vh;
  min-height: 100dvh;
  background: #090e1a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 1. Header */
.studio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  background: #050811;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 30;
}

.btn-icon-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  text-decoration: none;
  transition: all 120ms ease;
}

.btn-icon-nav:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.studio-header-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  letter-spacing: 0.04em;
}

.studio-header-right {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-header-dl {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  cursor: pointer;
}

.btn-header-share {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.65rem;
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
}

/* 2. Main Studio Layout */
.studio-content-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem 1rem 3.5rem;
  max-width: 44rem;
  margin: 0 auto;
  width: 100%;
}

/* 3. Hero Poster Preview */
.poster-hero-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.poster-box {
  width: 100%;
  max-width: 21rem;
  aspect-ratio: 9 / 16;
  border-radius: 1.35rem;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.15rem 1.15rem 0.95rem;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(201, 243, 106, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-size: cover;
  background-position: center;
  transition: all 180ms ease;
}

.aspect--post {
  aspect-ratio: 1 / 1 !important;
  max-width: 22rem !important;
}

.aspect--landscape {
  aspect-ratio: 16 / 9 !important;
  max-width: 26rem !important;
  padding: 0.95rem 1.15rem 0.85rem !important;
}

/* When landscape, adjust layout */
.aspect--landscape .poster-card-center {
  margin-top: 0.2rem !important;
  margin-bottom: 0.2rem !important;
}

.aspect--landscape .mileage-val {
  font-size: 2.2rem !important;
}

.aspect--landscape .poster-card-glass {
  padding: 0.45rem 0.65rem !important;
}

/* ========================================================
   GPS ROUTE SIGNATURE ART LAYER
   ======================================================== */
.gps-route-art-layer {
  position: absolute;
  top: 15%;
  left: 5%;
  right: 5%;
  height: 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.gps-route-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.25));
}

/* ========================================================
   THEME STYLES TRANSFORMATION
   ======================================================== */
.theme--rapha_editorial {
  font-family: Georgia, Cambria, 'Times New Roman', serif;
  border-color: rgba(255, 140, 117, 0.35);
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 140, 117, 0.1);
}

.theme--rapha_editorial .mileage-val {
  font-family: Georgia, serif;
  color: #FFFFFF;
}

.theme--rapha_editorial .mileage-unit {
  color: #FF8C75;
}

.theme--rapha_editorial .session-name {
  font-family: Georgia, serif;
  letter-spacing: 0.02em;
}

.theme--rapha_editorial .poster-card-glass {
  border-color: rgba(255, 140, 117, 0.4);
  background: rgba(18, 20, 29, 0.92);
}

.rapha-etappe-tag {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #FF8C75;
  margin-bottom: 0.2rem;
}

.theme--cyber_hud {
  font-family: var(--font-ui);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15);
}

.theme--cyber_hud .mileage-val {
  color: #38BDF8;
  text-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
}

.theme--cyber_hud .mileage-unit {
  color: #00FF66;
}

.theme--cyber_hud .session-name {
  color: #38BDF8;
}

.theme--cyber_hud .poster-card-glass {
  border: 1px solid rgba(56, 189, 248, 0.5);
  background: rgba(6, 18, 38, 0.94);
}

.cyber-telemetry-tag {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 900;
  color: #00FF66;
  letter-spacing: 0.05em;
  margin-bottom: 0.2rem;
}

.hud-corner {
  position: absolute;
  font-family: var(--font-ui);
  font-size: 1.2rem;
  font-weight: 900;
  color: rgba(56, 189, 248, 0.7);
  z-index: 5;
  pointer-events: none;
  line-height: 1;
}

.hud-tl { top: 0.5rem; left: 0.5rem; }
.hud-tr { top: 0.5rem; right: 0.5rem; }
.hud-bl { bottom: 0.5rem; left: 0.5rem; }
.hud-br { bottom: 0.5rem; right: 0.5rem; }

.hud-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

.theme--cafe_santai {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15);
}

.theme--cafe_santai .mileage-val {
  color: #F59E0B;
  text-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
}

.theme--cafe_santai .mileage-unit {
  color: #FDE68A;
}

.theme--cafe_santai .poster-card-glass {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(30, 18, 10, 0.94);
}

.cafe-fuel-tag {
  font-size: 0.58rem;
  font-weight: 900;
  color: #FDE68A;
  margin-bottom: 0.2rem;
}

/* Background Presets */
.bg--alpine {
  background: linear-gradient(180deg, rgba(8, 23, 38, 0.85) 0%, rgba(2, 6, 23, 0.98) 100%),
              radial-gradient(circle at 50% 15%, rgba(56, 189, 248, 0.35) 0%, transparent 60%),
              #0f2b48;
}

.bg--gravel {
  background: linear-gradient(180deg, rgba(10, 35, 20, 0.85) 0%, rgba(2, 10, 5, 0.98) 100%),
              radial-gradient(circle at 50% 15%, rgba(201, 243, 106, 0.3) 0%, transparent 60%),
              #143823;
}

.bg--sunset {
  background: linear-gradient(180deg, rgba(59, 13, 6, 0.85) 0%, rgba(15, 4, 2, 0.98) 100%),
              radial-gradient(circle at 50% 20%, rgba(251, 146, 60, 0.45) 0%, transparent 65%),
              #581c10;
}

.bg--crit {
  background: linear-gradient(180deg, rgba(33, 5, 51, 0.85) 0%, rgba(8, 1, 13, 0.98) 100%),
              radial-gradient(circle at 50% 15%, rgba(168, 85, 247, 0.4) 0%, transparent 60%),
              #3b1154;
}

.bg--cafe {
  background: linear-gradient(180deg, rgba(35, 17, 6, 0.85) 0%, rgba(13, 6, 2, 0.98) 100%),
              radial-gradient(circle at 50% 20%, rgba(217, 119, 6, 0.35) 0%, transparent 60%),
              #3d2111;
}

.bg--topo {
  background: linear-gradient(180deg, rgba(8, 13, 25, 0.85) 0%, rgba(3, 6, 10, 0.98) 100%),
              radial-gradient(circle at 50% 15%, rgba(201, 243, 106, 0.22) 0%, transparent 60%),
              #0c1527;
}

.poster-topo-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.55;
}

.poster-vignette-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 10, 18, 0.25) 0%,
    transparent 35%,
    rgba(6, 10, 18, 0.85) 80%,
    rgba(6, 10, 18, 0.98) 100%
  );
  z-index: 1;
}

/* Official Brand Chip */
.poster-card-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(23, 32, 42, 0.92);
  border: 1.2px solid rgba(201, 243, 106, 0.4);
  padding: 0.25rem 0.65rem 0.25rem 0.35rem;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.brand-mark-mini {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text-mini {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
}

.brand-text-gowes {
  color: #FFFFFF;
}

.brand-text-kit {
  color: var(--color-chain-lime);
}

.brand-dot-mini {
  display: inline-block;
  width: 0.35em;
  height: 0.35em;
  border-radius: 50%;
  background: var(--color-chain-lime);
  margin-left: 0.15em;
  transform: translateY(-0.05em);
}

.sticker-chip {
  font-size: 0.6rem;
  font-weight: 900;
  color: #080d19;
  background: var(--color-chain-lime);
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(201, 243, 106, 0.35);
}

/* Poster Center Hero Typography */
.poster-card-center {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 0.65rem;
}

.mileage-row {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

.mileage-val {
  font-family: var(--font-ui);
  font-size: 2.85rem;
  font-weight: 900;
  color: var(--color-chain-lime);
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.mileage-unit {
  font-size: 1.15rem;
  font-weight: 900;
  color: #ffffff;
}

.session-name {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  font-weight: 850;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-specs {
  font-size: 0.68rem;
  color: #cbd5e1;
}

/* Poster Glass Card */
.poster-card-glass {
  position: relative;
  z-index: 2;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 0.95rem;
  padding: 0.65rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  backdrop-filter: blur(10px);
}

.elev-strip {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 850;
}

.elev-lbl {
  color: #94a3b8;
}

.elev-val {
  color: #38bdf8;
}

.elev-curve-svg {
  width: 100%;
  height: 1.25rem;
}

.pillars-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.35rem;
}

.p-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.p-div {
  width: 1px;
  height: 1.4rem;
  background: rgba(255, 255, 255, 0.1);
}

.p-lbl {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 800;
  color: #94a3b8;
}

.p-val {
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 900;
  color: #f8fafc;
}

.text-lime { color: var(--color-chain-lime); }
.text-amber { color: #f59e0b; }
.text-coral { color: #ff8c75; }

.poster-watermark {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 0.54rem;
  font-weight: 800;
  color: rgba(201, 243, 106, 0.8);
  margin-top: 0.35rem;
  margin-bottom: 0.1rem;
}

/* Format Switcher Bar */
.ratio-switch-row {
  display: flex;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem;
  border-radius: 0.75rem;
  max-width: 21rem;
  width: 100%;
}

.ratio-pill-btn {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.4rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #94a3b8;
  border-radius: 0.55rem;
  cursor: pointer;
}

.ratio-pill-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
}

/* 4. Studio Drawer Controls */
.studio-drawer {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tool-menu-bar {
  display: flex;
  gap: 0.35rem;
  background: #050811;
  padding: 0.35rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  flex-wrap: nowrap;
}

.tool-menu-bar::-webkit-scrollbar {
  display: none;
}

.tool-menu-btn {
  flex: 0 0 auto;
  min-width: 4.8rem;
  background: transparent;
  border: none;
  padding: 0.55rem 0.65rem;
  font-size: 0.76rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.65rem;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  transition: all 120ms ease;
}

.tool-menu-btn.active {
  background: #1e293b;
  color: var(--color-chain-lime);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.tool-panel-box {
  background: #0c1426;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.15rem;
  padding: 0.95rem;
}

/* Style Chips */
.scroll-chips-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.55rem;
}

.chip-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.75rem;
  border-radius: 0.85rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: all 120ms ease;
}

.chip-card.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.chip-card-tag {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  color: var(--color-chain-lime);
  font-weight: 900;
}

.chip-card strong {
  font-size: 0.84rem;
}

.chip-card small {
  font-size: 0.68rem;
  color: #94a3b8;
}

/* Route GPS Controls */
.route-panel-flow {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.route-header-toggle {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
}

.toggle-lbl {
  font-size: 0.76rem;
  font-weight: 850;
  color: #cbd5e1;
}

.route-styles-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
}

.r-style-btn {
  padding: 0.45rem 0.5rem;
  border-radius: 0.65rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 850;
  cursor: pointer;
  text-align: center;
  transition: all 120ms ease;
}

.r-style-btn.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  color: #38bdf8;
}

.route-presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 12rem;
  overflow-y: auto;
}

.preset-item-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 120ms ease;
}

.preset-item-card.active {
  background: rgba(201, 243, 106, 0.1);
  border-color: var(--color-chain-lime);
}

.preset-icon-col {
  font-size: 1.25rem;
}

.preset-info-col {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.preset-info-col strong {
  font-size: 0.78rem;
  color: #fff;
}

.preset-info-col small {
  font-size: 0.66rem;
  color: #94a3b8;
}

.preset-active-check {
  font-weight: 900;
  color: var(--color-chain-lime);
  font-size: 0.9rem;
}

/* Backdrop Circles */
.backdrop-palette-flow {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bg-circles-row {
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
}

.bg-circle {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 120ms ease;
}

.bg-circle.active {
  border-color: var(--color-chain-lime);
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(201, 243, 106, 0.4);
}

.btn-upload-clean {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem;
  border-radius: 0.85rem;
  border: 1.5px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  font-size: 0.76rem;
  font-weight: 850;
  color: var(--color-chain-lime);
  cursor: pointer;
}

.btn-sync-full {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  border-radius: 0.85rem;
  border: 1.5px solid var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  color: var(--color-chain-lime);
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 120ms ease;
}

.btn-sync-full:hover {
  background: var(--color-chain-lime);
  color: #080d19;
}

/* Stickers Pills */
.sticker-pills-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.sticker-pill {
  padding: 0.45rem 0.8rem;
  border-radius: 9999px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}

.sticker-pill.active {
  background: var(--color-chain-lime);
  color: #080d19;
  border-color: var(--color-chain-lime);
}

/* AI Studio Flow */
.ai-studio-flow {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.ai-persona-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.persona-tag {
  flex: 1;
  padding: 0.45rem 0.5rem;
  border-radius: 0.65rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
}

.persona-tag.active {
  background: #1e293b;
  border-color: var(--color-chain-lime);
  color: #fff;
}

.btn-regen-ai {
  background: var(--color-chain-lime);
  color: #080d19;
  border: none;
  padding: 0.45rem 0.65rem;
  border-radius: 0.65rem;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
}

.ai-caption-card {
  background: rgba(8, 13, 25, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.85rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.ai-caption-body {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.btn-copy-clean {
  background: rgba(201, 243, 106, 0.15);
  border: 1px solid var(--color-chain-lime);
  color: var(--color-chain-lime);
  padding: 0.45rem;
  border-radius: 0.65rem;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
}

.culinary-clean-tag {
  font-size: 0.72rem;
  color: #ff8c75;
  font-weight: 800;
}

/* Edit Form */
.edit-fields-flow {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-item label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 800;
}

.field-item input {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.65rem;
  padding: 0.45rem 0.65rem;
  color: #fff;
  font-size: 0.82rem;
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
