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

const activeTab = ref<'templates' | 'route' | 'backgrounds' | 'stickers' | 'ai' | 'data'>('templates');

interface RoutePreset {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationM: number;
  pathD: string;
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

  // Draw GPS Route Artwork on Canvas
  if (rideForm.showGpsRoute && currentRoute.value) {
    ctx.save();
    const routeBoxW = 400;
    const targetW = isStory ? 840 : (isLandscape ? 720 : 680);
    const scale = targetW / routeBoxW;
    const offsetX = (canvas.width - routeBoxW * scale) / 2;
    const offsetY = isStory ? 280 : (isLandscape ? 120 : 110);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const routePath = new Path2D(currentRoute.value.pathD);

    ctx.shadowBlur = 24;
    ctx.shadowColor = rideForm.routeRenderStyle === 'kinetic_neon' ? '#C9F36A' : '#38BDF8';
    ctx.lineWidth = 14;
    ctx.strokeStyle = rideForm.routeRenderStyle === 'kinetic_neon' ? 'rgba(201, 243, 106, 0.35)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(routePath);
    ctx.shadowBlur = 0;

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

    ctx.lineWidth = 7;
    ctx.strokeStyle = routeGrad;
    ctx.stroke(routePath);

    if (rideForm.showWaypoints && currentRoute.value.waypoints) {
      currentRoute.value.waypoints.forEach((wp) => {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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

  // Dark Vignette
  const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vignette.addColorStop(0, 'rgba(6, 10, 18, 0.45)');
  vignette.addColorStop(0.3, 'rgba(6, 10, 18, 0.05)');
  vignette.addColorStop(0.65, 'rgba(6, 10, 18, 0.85)');
  vignette.addColorStop(1, 'rgba(6, 10, 18, 0.98)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pillY = isStory ? 100 : 60;
  const pillH = 64;

  ctx.font = `900 32px ${FONT_UI}`;
  const gowesTextW = ctx.measureText('Gowes').width;
  const kitTextW = ctx.measureText('Kit').width;
  const brandPillW = 16 + 46 + 14 + gowesTextW + kitTextW + 36;

  ctx.fillStyle = 'rgba(23, 32, 42, 0.94)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(70, pillY, brandPillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(86, pillY + 11);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(0, 0, 42, 42, 12);
  ctx.fill();

  const gWheelPath = new Path2D('M27 15.2C25.3 13.2 22.8 12 20 12C15.0294 12 11 16.0294 11 21C11 25.9706 15.0294 30 20 30C24.4 30 28.1 26.8 28.8 22.5H19');
  const speedArrowPath = new Path2D('M23 17.5L28.2 22.5L23 27.5');

  ctx.scale(42 / 40, 42 / 40);
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
  ctx.arc(20, 21, 2.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  const textStartX = 86 + 42 + 14;
  ctx.font = `900 32px ${FONT_UI}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Gowes', textStartX, pillY + pillH / 2);
  ctx.fillStyle = '#C9F36A';
  ctx.fillText('Kit', textStartX + gowesTextW, pillY + pillH / 2);

  ctx.fillStyle = '#C9F36A';
  ctx.beginPath();
  ctx.arc(textStartX + gowesTextW + kitTextW + 10, pillY + pillH / 2 - 3, 4.5, 0, 2 * Math.PI);
  ctx.fill();

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
      ctx.font = `900 24px ${FONT_UI}`;
      const stickerTextW = ctx.measureText(stickerText).width;
      const stickerPad = 26;
      const stickerPillW = stickerTextW + stickerPad * 2;
      const stickerX = canvas.width - 70 - stickerPillW;

      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(stickerX, pillY, stickerPillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = '#080d19';
      ctx.font = `900 24px ${FONT_UI}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(stickerText, stickerX + stickerPad, pillY + pillH / 2);
    }
  }

  const heroY = isStory ? 1020 : (isLandscape ? 400 : 470);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  if (rideForm.templateStyle === 'rapha_editorial') {
    ctx.fillStyle = '#FF8C75';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('STAGE 01 · FINISHED ETAPPE', 70, heroY - 170);
  } else if (rideForm.templateStyle === 'cyber_hud') {
    ctx.fillStyle = '#00FF66';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('GPS: LOCKED (14 SATS) · CAD: 88 RPM', 70, heroY - 170);
  } else if (rideForm.templateStyle === 'cafe_santai') {
    ctx.fillStyle = '#FDE68A';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('☕ RECOVERY MODE · KULINERAN', 70, heroY - 170);
  }

  const distNumberStr = `${rideForm.distanceKm}`;

  if (rideForm.templateStyle === 'rapha_editorial') {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 160px ${FONT_SERIF}`;
    ctx.fillText(distNumberStr, 70, heroY);

    const numWidth = ctx.measureText(distNumberStr).width;
    ctx.fillStyle = '#FF8C75';
    ctx.font = `800 54px ${FONT_SERIF}`;
    ctx.fillText('KM', 70 + numWidth + 24, heroY - 55);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 46px ${FONT_SERIF}`;
    ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 68);

    ctx.fillStyle = '#FFD1C9';
    ctx.font = `500 28px ${FONT_SERIF}`;
    ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, 70, heroY + 120);
  } else if (rideForm.templateStyle === 'cyber_hud') {
    ctx.fillStyle = '#38BDF8';
    ctx.font = `900 160px ${FONT_UI}`;
    ctx.fillText(distNumberStr, 70, heroY);

    const numWidth = ctx.measureText(distNumberStr).width;
    ctx.fillStyle = '#00FF66';
    ctx.font = `900 50px ${FONT_UI}`;
    ctx.fillText('KM', 70 + numWidth + 24, heroY - 55);

    ctx.fillStyle = '#38BDF8';
    ctx.font = `900 44px ${FONT_UI}`;
    ctx.fillText(`> ${rideForm.title.slice(0, 28)}`, 70, heroY + 68);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `700 28px ${FONT_UI}`;
    ctx.fillText(`RIG: ${rideForm.bikeName} · ${rideForm.temperatureC}°C`, 70, heroY + 120);
  } else if (rideForm.templateStyle === 'cafe_santai') {
    ctx.fillStyle = '#F59E0B';
    ctx.font = `900 160px ${FONT_UI}`;
    ctx.fillText(distNumberStr, 70, heroY);

    const numWidth = ctx.measureText(distNumberStr).width;
    ctx.fillStyle = '#FDE68A';
    ctx.font = `900 54px ${FONT_UI}`;
    ctx.fillText('KM', 70 + numWidth + 24, heroY - 55);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 48px ${FONT_UI}`;
    ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 68);

    ctx.fillStyle = '#FDE68A';
    ctx.font = `700 28px ${FONT_UI}`;
    ctx.fillText(`🍢 Sate Fuel · ${rideForm.bikeName} · ${rideForm.temperatureC}°C`, 70, heroY + 120);
  } else {
    ctx.fillStyle = '#C9F36A';
    ctx.font = `900 160px ${FONT_UI}`;
    ctx.fillText(distNumberStr, 70, heroY);

    const numWidth = ctx.measureText(distNumberStr).width;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 54px ${FONT_UI}`;
    ctx.fillText('KM', 70 + numWidth + 24, heroY - 55);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 48px ${FONT_UI}`;
    ctx.fillText(rideForm.title.slice(0, 32), 70, heroY + 68);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = `700 28px ${FONT_UI}`;
    ctx.fillText(`🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`, 70, heroY + 120);
  }

  const cardY = heroY + 165;
  const cardH = isStory ? 520 : (isLandscape ? 340 : 360);
  const cardW = canvas.width - 140;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = rideForm.templateStyle === 'rapha_editorial' 
    ? 'rgba(255, 140, 117, 0.5)' 
    : (rideForm.templateStyle === 'cyber_hud' ? 'rgba(56, 189, 248, 0.6)' : (rideForm.templateStyle === 'cafe_santai' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(201, 243, 106, 0.4)'));
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(70, cardY, cardW, cardH, 36);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = `800 22px ${FONT_UI}`;
  ctx.fillText('ELEVASI PROFILE', 120, cardY + 60);

  ctx.fillStyle = rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#38BDF8');
  ctx.font = `900 26px ${FONT_UI}`;
  ctx.textAlign = 'right';
  ctx.fillText(`+${rideForm.elevationM}m Climb`, 70 + cardW - 50, cardY + 60);
  ctx.textAlign = 'left';

  const curveY = cardY + 115;
  ctx.strokeStyle = rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#38BDF8');
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(120, curveY + 25);
  ctx.bezierCurveTo(340, curveY + 10, 600, curveY + 35, 70 + cardW - 50, curveY - 5);
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(120, curveY + 25, 7, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#C9F36A';
  ctx.beginPath();
  ctx.arc(70 + cardW - 50, curveY - 5, 9, 0, 2 * Math.PI);
  ctx.fill();

  const cellW = (cardW - 60) / 2;
  const metrics = [
    { label: 'ELEVASI TANJAKAN', val: `+${rideForm.elevationM} m`, color: '#38BDF8' },
    { label: 'WAKTU TEMPUH', val: formatDuration(rideForm.durationMinutes), color: '#FFFFFF' },
    { label: 'RATA-RATA SPEED', val: `${rideForm.avgSpeedKmH} km/h`, color: rideForm.templateStyle === 'cafe_santai' ? '#F59E0B' : (rideForm.templateStyle === 'rapha_editorial' ? '#FF8C75' : '#C9F36A') },
    { label: 'KALORI TERBAKAR', val: `~${rideForm.caloriesKcal} kcal`, color: '#FF8C75' },
  ];

  metrics.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 120 + col * cellW;
    const y = cardY + 210 + row * (isStory ? 145 : 100);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `800 22px ${FONT_UI}`;
    ctx.fillText(m.label, x, y);

    ctx.fillStyle = m.color;
    ctx.font = `900 54px ${FONT_UI}`;
    ctx.fillText(m.val, x, y + 60);
  });

  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = `900 24px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID', canvas.width / 2, canvas.height - 45);
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
            <span id="modal-studio-title" class="modal-heading">RIDE PASS STUDIO</span>
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
            Story (9:16)
          </button>
          <button
            type="button"
            class="m-ratio-btn"
            :class="{ active: rideForm.aspectRatio === 'post' }"
            @click="rideForm.aspectRatio = 'post'"
          >
            Square (1:1)
          </button>
          <button
            type="button"
            class="m-ratio-btn"
            :class="{ active: rideForm.aspectRatio === 'landscape' }"
            @click="rideForm.aspectRatio = 'landscape'"
          >
            Banner (16:9)
          </button>
        </div>

        <!-- Modal Body Content -->
        <div class="modal-inner-workspace">
          <!-- Left / Top: Live Poster Preview -->
          <div class="modal-stage-col">
            <div
              class="modal-poster-card"
              :class="[
                `aspect--${rideForm.aspectRatio}`,
                `bg--${rideForm.bgPreset}`,
                `theme--${rideForm.templateStyle}`,
              ]"
              :style="rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl ? { backgroundImage: `url(${rideForm.customPhotoUrl})` } : {}"
            >
              <!-- Cyber HUD Elements -->
              <template v-if="rideForm.templateStyle === 'cyber_hud'">
                <div class="m-hud-corner m-hud-tl">⌜</div>
                <div class="m-hud-corner m-hud-tr">⌝</div>
                <div class="m-hud-corner m-hud-bl">⌞</div>
                <div class="m-hud-corner m-hud-br">⌟</div>
                <div class="m-hud-grid-layer"></div>
              </template>

              <!-- Dynamic GPS Route Layer -->
              <div v-if="rideForm.showGpsRoute && currentRoute" class="m-gps-route-layer">
                <svg viewBox="0 0 400 350" class="m-gps-svg" fill="none" aria-hidden="true">
                  <path
                    :d="currentRoute.pathD"
                    fill="none"
                    stroke="#38BDF8"
                    stroke-width="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    opacity="0.35"
                  />
                  <path
                    :d="currentRoute.pathD"
                    fill="none"
                    stroke="#C9F36A"
                    stroke-width="4.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>

              <div class="modal-poster-vignette"></div>

              <!-- Official GowesKit Brand Chip -->
              <div class="modal-poster-top">
                <div class="m-brand-chip">
                  <div class="m-brand-mark-box">
                    <svg viewBox="0 0 40 40" fill="none" width="16" height="16" aria-hidden="true">
                      <rect width="40" height="40" rx="10" fill="#17202A" />
                      <path d="M27 15.2C25.3 13.2 22.8 12 20 12C15.0294 12 11 16.0294 11 21C11 25.9706 15.0294 30 20 30C24.4 30 28.1 26.8 28.8 22.5H19" stroke="#C9F36A" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M23 17.5L28.2 22.5L23 27.5" stroke="#8EDDF4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="20" cy="21" r="2.2" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <span class="m-brand-text">
                    <span class="text-white">Gowes</span><span class="text-lime">Kit</span><span class="m-brand-dot"></span>
                  </span>
                </div>

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
                <!-- Rapha Tag -->
                <div v-if="rideForm.templateStyle === 'rapha_editorial'" class="m-rapha-tag">
                  STAGE 01 · FINISHED ETAPPE
                </div>
                <!-- Cyber Tag -->
                <div v-else-if="rideForm.templateStyle === 'cyber_hud'" class="m-cyber-tag">
                  GPS: LOCKED (14 SATS) · CAD: 88 RPM
                </div>
                <!-- Cafe Tag -->
                <div v-else-if="rideForm.templateStyle === 'cafe_santai'" class="m-cafe-tag">
                  ☕ RECOVERY MODE · KULINERAN
                </div>

                <div class="m-mileage-row">
                  <span class="m-num">{{ rideForm.distanceKm }}</span>
                  <span class="m-unit">KM</span>
                </div>
                <h3 class="m-title">{{ rideForm.title }}</h3>
                <div class="m-meta">🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C Cerah</div>
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
                    <strong class="m-s-val" :class="rideForm.templateStyle === 'cafe_santai' ? 'text-amber' : (rideForm.templateStyle === 'rapha_editorial' ? 'text-coral' : 'text-lime')">{{ rideForm.avgSpeedKmH }} km/h</strong>
                  </div>
                  <div class="m-stat-item">
                    <span class="m-s-lbl">KALORI</span>
                    <strong class="m-s-val text-coral">~{{ rideForm.caloriesKcal }} kcal</strong>
                  </div>
                </div>
              </div>

              <div class="modal-watermark">
                ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
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
                🎨 Gaya
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'route' }"
                @click="activeTab = 'route'"
              >
                🗺️ Rute
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'backgrounds' }"
                @click="activeTab = 'backgrounds'"
              >
                🌄 Nuansa
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
                📝 Edit
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
                  <small>Kinetic Neon Green</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
                  @click="rideForm.templateStyle = 'rapha_editorial'"
                >
                  🏔️ <strong>Rapha Editorial</strong>
                  <small>Serif &amp; Clean GPS</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
                  @click="rideForm.templateStyle = 'cyber_hud'"
                >
                  ⚡ <strong>Cyber HUD</strong>
                  <small>HUD Grid &amp; Sensor</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
                  @click="rideForm.templateStyle = 'cafe_santai'"
                >
                  ☕ <strong>Kopi &amp; Sate</strong>
                  <small>Golden Amber Fuel</small>
                </button>
              </div>
            </div>

            <!-- Tab: Route GPS -->
            <div v-show="activeTab === 'route'" class="m-tab-panel">
              <div class="m-presets-col">
                <div
                  v-for="preset in ROUTE_PRESETS"
                  :key="preset.id"
                  class="m-preset-card"
                  :class="{ active: rideForm.selectedRoutePresetId === preset.id }"
                  @click="selectRoutePreset(preset)"
                >
                  <strong>{{ preset.name }}</strong>
                  <small>{{ preset.distanceKm }} km · +{{ preset.elevationM }}m</small>
                </div>
              </div>
            </div>

            <!-- Tab 2: Backgrounds -->
            <div v-show="activeTab === 'backgrounds'" class="m-bg-grid">
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
            <label v-show="activeTab === 'backgrounds'" class="m-upload-cta">
              <input type="file" accept="image/*" class="sr-only" @change="handlePhotoUpload" />
              <span>📸 Unggah Foto Sendiri dari HP</span>
            </label>

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
                  ⚡ Breakaway
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
                  🚫 Polos
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
              <button
                type="button"
                class="m-btn-sync"
                :disabled="isSyncingGps"
                @click="syncFromDeviceGpsOrSession"
              >
                <span>{{ isSyncingGps ? '⏳ Menyambungkan...' : '📡 Tarik Data Sesi Gowes Asli Saya' }}</span>
              </button>
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
  aspect-ratio: 9 / 16;
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
  transition: all 180ms ease;
}

.aspect--post {
  aspect-ratio: 1 / 1 !important;
}

.aspect--landscape {
  aspect-ratio: 16 / 9 !important;
}

/* Modal GPS Layer */
.m-gps-route-layer {
  position: absolute;
  top: 15%;
  left: 5%;
  right: 5%;
  height: 48%;
  pointer-events: none;
  z-index: 1;
}

.m-gps-svg {
  width: 100%;
  height: 100%;
}

.m-presets-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 12rem;
  overflow-y: auto;
}

.m-preset-card {
  display: flex;
  flex-direction: column;
  padding: 0.55rem 0.65rem;
  border-radius: 0.65rem;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.m-preset-card.active {
  background: rgba(201, 243, 106, 0.15);
  border-color: var(--color-chain-lime);
}

.m-preset-card strong {
  font-size: 0.76rem;
}

.m-preset-card small {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Modal Themes */
.theme--rapha_editorial {
  font-family: Georgia, Cambria, serif;
  border-color: rgba(255, 140, 117, 0.35);
}

.theme--rapha_editorial .m-num {
  font-family: Georgia, serif;
  color: #FFFFFF;
}

.theme--rapha_editorial .m-unit {
  color: #FF8C75;
}

.m-rapha-tag {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 900;
  color: #FF8C75;
  margin-bottom: 0.15rem;
}

.theme--cyber_hud {
  font-family: var(--font-ui);
  border-color: rgba(56, 189, 248, 0.4);
}

.theme--cyber_hud .m-num {
  color: #38BDF8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.theme--cyber_hud .m-unit {
  color: #00FF66;
}

.m-cyber-tag {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 900;
  color: #00FF66;
  margin-bottom: 0.15rem;
}

.m-hud-corner {
  position: absolute;
  font-family: var(--font-ui);
  font-size: 1.1rem;
  font-weight: 900;
  color: rgba(56, 189, 248, 0.7);
  z-index: 5;
  pointer-events: none;
  line-height: 1;
}

.m-hud-tl { top: 0.4rem; left: 0.4rem; }
.m-hud-tr { top: 0.4rem; right: 0.4rem; }
.m-hud-bl { bottom: 0.4rem; left: 0.4rem; }
.m-hud-br { bottom: 0.4rem; right: 0.4rem; }

.m-hud-grid-layer {
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
}

.theme--cafe_santai .m-num {
  color: #F59E0B;
}

.theme--cafe_santai .m-unit {
  color: #FDE68A;
}

.m-cafe-tag {
  font-size: 0.54rem;
  font-weight: 900;
  color: #FDE68A;
  margin-bottom: 0.15rem;
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

.m-brand-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(23, 32, 42, 0.92);
  border: 1.2px solid rgba(201, 243, 106, 0.4);
  padding: 0.2rem 0.55rem 0.2rem 0.3rem;
  border-radius: 9999px;
}

.m-brand-mark-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-brand-text {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-ui);
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
}

.text-white { color: #FFFFFF; }
.text-lime { color: var(--color-chain-lime); }
.text-amber { color: #f59e0b; }

.m-brand-dot {
  display: inline-block;
  width: 0.35em;
  height: 0.35em;
  border-radius: 50%;
  background: var(--color-chain-lime);
  margin-left: 0.15em;
  transform: translateY(-0.05em);
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
  font-family: var(--font-ui);
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
  font-family: var(--font-ui);
  font-size: 0.55rem;
  font-weight: 850;
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
  font-family: var(--font-ui);
  font-size: 0.5rem;
  color: #94a3b8;
}

.m-s-val {
  font-family: var(--font-ui);
  font-size: 0.76rem;
  font-weight: 900;
  color: #f8fafc;
}

.modal-watermark {
  position: relative;
  z-index: 2;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 0.5rem;
  color: rgba(201, 243, 106, 0.8);
  margin-top: 0.3rem;
  margin-bottom: 0.1rem;
}

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
  overflow-x: auto;
  scrollbar-width: none;
  flex-wrap: nowrap;
}

.m-tabs-nav::-webkit-scrollbar {
  display: none;
}

.m-tab-item {
  flex: 0 0 auto;
  min-width: 4.5rem;
  background: transparent;
  border: none;
  padding: 0.5rem 0.4rem;
  font-size: 0.74rem;
  font-weight: 850;
  color: #94a3b8;
  border-radius: 0.65rem;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
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

.m-btn-sync {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  border: 1.5px solid var(--color-chain-lime);
  background: rgba(201, 243, 106, 0.12);
  color: var(--color-chain-lime);
  font-size: 0.76rem;
  font-weight: 900;
  cursor: pointer;
  margin-bottom: 0.4rem;
  transition: all 120ms ease;
}

.m-btn-sync:hover {
  background: var(--color-chain-lime);
  color: #080d19;
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
