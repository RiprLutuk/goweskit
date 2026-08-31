<script setup lang="ts">
import type { GenerateRideStoryResponse } from '@goweskit/contracts';
import { generateGpxXml, parseGpxToRoute } from '../gpx-export';

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
const activeTool = ref<
  'style' | 'route' | 'backdrop' | 'stickers' | 'ai' | 'edit'
>('style');

const STICKER_LABELS: Record<string, string> = {
  kom: '👑 KOM HUNTER',
  cafe: '☕ COFFEE APPROVED',
  beast: '⛰️ CLIMB BEAST',
  speed: '⚡ 26+ KM/H',
  power: '⚡ AVG 245W',
  gradient: '⛰️ MAX 18.5%',
  hr: '❤️ 158 BPM',
  fuel: '🍲 FUEL SATE',
  podium: '🏁 PODIUM FINISHER',
};

function getStickerLabel(sticker: string): string {
  return STICKER_LABELS[sticker] || '';
}

// Preset Routes Library with Authentic Road Geometries & Topography
interface RoutePreset {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationM: number;
  pathD: string; // Real road SVG coordinate string
  waypoints: Array<{
    name: string;
    icon: string;
    x: number;
    y: number;
    type: 'coffee' | 'climb' | 'photo' | 'sprint';
  }>;
}

const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: 'cisadane_intro',
    name: 'Cisadane Gravel & Pasar Lama Heritage',
    location: 'Tangerang Kota',
    distanceKm: 9.8,
    elevationM: 68,
    pathD:
      'M 105 270 L 108 220 L 102 170 L 112 120 L 138 80 L 175 60 L 218 55 L 255 72 L 282 102 L 292 150 L 298 200 L 290 245 L 262 265 L 222 250 L 182 260 L 142 275 Z',
    waypoints: [
      {
        name: 'Start Cisadane (KM 0)',
        icon: '🚩',
        x: 105,
        y: 270,
        type: 'photo',
      },
      { name: 'Jembatan Berendeng', icon: '🌉', x: 138, y: 80, type: 'photo' },
      {
        name: 'Pasar Lama Street Food',
        icon: '☕',
        x: 292,
        y: 150,
        type: 'coffee',
      },
      {
        name: 'Benteng Heritage Finish',
        icon: '🏁',
        x: 182,
        y: 260,
        type: 'sprint',
      },
    ],
  },
  {
    id: 'sentul_loop',
    name: 'Sentul Gravel Loop: KM 0 & Kopi Tubing',
    location: 'Sentul, Bogor',
    distanceKm: 45.8,
    elevationM: 580,
    pathD:
      'M 75 270 L 90 230 L 115 205 L 105 180 L 130 160 L 170 175 L 205 150 L 220 120 L 255 105 L 285 70 L 315 65 L 340 90 L 325 130 L 335 165 L 310 200 L 280 215 L 250 200 L 230 230 L 195 245 L 160 235 L 130 260 L 95 275 Z',
    waypoints: [
      { name: 'Start KM 0 Sentul', icon: '🚩', x: 75, y: 270, type: 'photo' },
      {
        name: 'Tanjakan Rainbow (+420m)',
        icon: '⛰️',
        x: 255,
        y: 105,
        type: 'climb',
      },
      {
        name: 'Warung Kopi & Sate',
        icon: '☕',
        x: 325,
        y: 130,
        type: 'coffee',
      },
      { name: 'Sprint Finish', icon: '🏁', x: 195, y: 245, type: 'sprint' },
    ],
  },
  {
    id: 'km0_bojong',
    name: 'Tanjakan KM 0 Bojong Koneng Challenge',
    location: 'Babakan Madang',
    distanceKm: 28.4,
    elevationM: 720,
    pathD:
      'M 60 270 L 85 240 L 115 250 L 135 220 L 165 225 L 180 195 L 215 190 L 230 155 L 265 145 L 280 105 L 310 95 L 330 65 L 340 45 L 315 40 L 285 55 L 250 85 L 215 105 L 180 135 L 150 160 L 120 195 L 90 225 L 60 270 Z',
    waypoints: [
      {
        name: 'Check-in Gate Sentul',
        icon: '🚩',
        x: 60,
        y: 270,
        type: 'photo',
      },
      { name: 'Hairpin S1 Climb', icon: '⚡', x: 180, y: 195, type: 'climb' },
      { name: 'KM 0 Summit (+720m)', icon: '👑', x: 340, y: 45, type: 'climb' },
      {
        name: 'Kopi Daong Pitstop',
        icon: '☕',
        x: 215,
        y: 105,
        type: 'coffee',
      },
    ],
  },
  {
    id: 'jkt_sudirman',
    name: 'Jakarta Sudirman - Thamrin - Monas Loop',
    location: 'DKI Jakarta',
    distanceKm: 32.0,
    elevationM: 45,
    pathD:
      'M 130 280 L 130 180 L 130 110 L 140 80 L 180 60 L 230 60 L 270 80 L 280 110 L 280 180 L 280 280 L 250 285 L 205 280 L 160 285 Z',
    waypoints: [
      { name: 'Bundaran HI', icon: '🚩', x: 130, y: 180, type: 'photo' },
      { name: 'Monas Sprint Lap', icon: '⚡', x: 205, y: 60, type: 'sprint' },
      {
        name: 'GBK Senayan Pitstop',
        icon: '☕',
        x: 280,
        y: 230,
        type: 'coffee',
      },
    ],
  },
  {
    id: 'dago_bandung',
    name: 'Dago Pakar - Tahura Pine Trail Bandung',
    location: 'Bandung Utara',
    distanceKm: 38.5,
    elevationM: 890,
    pathD:
      'M 80 280 L 105 245 L 130 240 L 145 200 L 175 185 L 195 150 L 225 140 L 250 100 L 280 85 L 310 55 L 330 70 L 315 110 L 285 145 L 255 180 L 220 210 L 185 235 L 145 260 L 110 285 Z',
    waypoints: [
      { name: 'Dago Bawah Start', icon: '🚩', x: 80, y: 280, type: 'photo' },
      { name: 'Tahura Pine Forest', icon: '🌲', x: 195, y: 150, type: 'photo' },
      {
        name: 'Tebing Keraton Peak (+1274m)',
        icon: '⛰️',
        x: 310,
        y: 55,
        type: 'climb',
      },
      { name: 'Armor Kopi Tahura', icon: '☕', x: 220, y: 210, type: 'coffee' },
    ],
  },
  {
    id: 'bromo_gravel',
    name: 'Bromo Sea of Sand Gravel Epic',
    location: 'Tengger, Jawa Timur',
    distanceKm: 52.0,
    elevationM: 1450,
    pathD:
      'M 60 130 L 95 100 L 140 85 L 185 95 L 230 75 L 275 80 L 315 105 L 340 140 L 330 180 L 295 215 L 250 235 L 200 245 L 155 230 L 115 240 L 80 210 L 60 170 Z',
    waypoints: [
      { name: 'Cemoro Lawang Gate', icon: '🚩', x: 60, y: 130, type: 'photo' },
      {
        name: 'Lautan Pasir Berbisik',
        icon: '⚡',
        x: 230,
        y: 75,
        type: 'sprint',
      },
      {
        name: 'Kawah Bromo Peak (+2329m)',
        icon: '🌋',
        x: 340,
        y: 140,
        type: 'climb',
      },
      { name: 'Bukit Teletubbies', icon: '☕', x: 155, y: 230, type: 'coffee' },
    ],
  },
];

// Determine matching preset from URL params
const detectedPreset = computed(() => {
  const noteLower = (initialNote || '').toLowerCase();
  if (
    noteLower.includes('cisadane') ||
    noteLower.includes('tangerang') ||
    initialDistance < 15
  ) {
    return ROUTE_PRESETS[0];
  }
  if (
    noteLower.includes('sudirman') ||
    noteLower.includes('monas') ||
    noteLower.includes('jakarta')
  ) {
    return ROUTE_PRESETS[3];
  }
  if (
    noteLower.includes('bojong') ||
    noteLower.includes('km 0') ||
    noteLower.includes('km0')
  ) {
    return ROUTE_PRESETS[2];
  }
  if (
    noteLower.includes('dago') ||
    noteLower.includes('tahura') ||
    noteLower.includes('bandung')
  ) {
    return ROUTE_PRESETS[4];
  }
  if (noteLower.includes('bromo') || noteLower.includes('tengger')) {
    return ROUTE_PRESETS[5];
  }
  return ROUTE_PRESETS[1];
});

// Form state
const rideForm = reactive({
  title: initialNote,
  distanceKm: initialDistance,
  elevationM: initialElevation,
  durationMinutes: initialDuration,
  avgSpeedKmH: Number(
    (initialDistance / Math.max(initialDuration / 60, 0.05)).toFixed(1),
  ),
  caloriesKcal: 980,
  temperatureC: 25,
  bikeName: initialBike,
  templateStyle: 'strava_bold' as
    'strava_bold' | 'rapha_editorial' | 'cyber_hud' | 'cafe_santai',
  aspectRatio: 'story' as 'story' | 'post' | 'landscape',
  activeSticker: 'kom' as
    | 'kom'
    | 'cafe'
    | 'beast'
    | 'speed'
    | 'power'
    | 'gradient'
    | 'hr'
    | 'fuel'
    | 'podium'
    | 'none',
  bgPreset: 'alpine' as
    'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'topo' | 'custom',
  customPhotoUrl: '',
  // GPS Route Customizations
  showGpsRoute: true,
  selectedRoutePresetId: detectedPreset.value?.id || 'cisadane_intro',
  routeRenderStyle: 'spectrum_elevation' as
    'spectrum_elevation' | 'kinetic_neon' | 'topo_radar' | 'minimal_wire',
  showWaypoints: true,
});

const customGpxRoute = ref<RoutePreset | null>(null);

const currentRoute = computed(() => {
  if (customGpxRoute.value && rideForm.selectedRoutePresetId === 'custom_gpx') {
    return customGpxRoute.value;
  }
  return (
    ROUTE_PRESETS.find((r) => r.id === rideForm.selectedRoutePresetId) ||
    ROUTE_PRESETS[0]
  );
});

function selectRoutePreset(preset: RoutePreset) {
  rideForm.selectedRoutePresetId = preset.id;
  rideForm.title = preset.name;
  rideForm.distanceKm = preset.distanceKm;
  rideForm.elevationM = preset.elevationM;
  rideForm.avgSpeedKmH = Number(
    (preset.distanceKm / Math.max(rideForm.durationMinutes / 60, 0.05)).toFixed(
      1,
    ),
  );
  toast.success(
    'Rute GPS Diterapkan!',
    `${preset.name} (${preset.distanceKm} km, +${preset.elevationM}m)`,
  );
}

const isSyncingGps = ref(false);

async function syncFromDeviceGpsOrSession() {
  isSyncingGps.value = true;
  try {
    const sessionRes = await api<{
      sessions: Array<{
        id: string;
        status: string;
        startedAt: string;
        routeNote?: string | null;
      }>;
    }>('/safety/sessions').catch(() => null);

    if (sessionRes?.sessions && sessionRes.sessions.length > 0) {
      const latest = sessionRes.sessions[0];
      if (latest) {
        // Attempt to fetch actual GPS tracking breadcrumbs
        const locationsRes = await api<{
          locations: Array<{
            latitude: number;
            longitude: number;
            altitude?: number | null;
            recordedAt: string;
          }>;
        }>(`/safety/sessions/${latest.id}/locations`).catch(() => null);

        if (locationsRes?.locations && locationsRes.locations.length >= 2) {
          const gpxPoints = locationsRes.locations.map((loc) => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude ?? null,
            time: loc.recordedAt,
          }));
          const gpxXml = generateGpxXml(
            latest.routeNote || 'Sesi Gowes Solo',
            gpxPoints,
          );
          const parsed = parseGpxToRoute(
            gpxXml,
            latest.routeNote || 'Sesi Gowes Solo',
          );

          customGpxRoute.value = {
            id: 'custom_gpx',
            name: parsed.name,
            location: 'Sesi Solo Live Track',
            distanceKm: parsed.distanceKm,
            elevationM: parsed.elevationM,
            pathD: parsed.pathD,
            waypoints: parsed.waypoints,
          };

          rideForm.selectedRoutePresetId = 'custom_gpx';
          rideForm.title = parsed.name;
          rideForm.distanceKm = parsed.distanceKm;
          rideForm.elevationM = parsed.elevationM;
          rideForm.durationMinutes = parsed.durationMinutes;
          rideForm.avgSpeedKmH = Number(
            (
              parsed.distanceKm / Math.max(parsed.durationMinutes / 60, 0.05)
            ).toFixed(1),
          );
          rideForm.showGpsRoute = true;

          toast.success(
            '✨ Jejak GPS Sesi Solo Berhasil Ditarik!',
            `${parsed.name} (${parsed.distanceKm} km, +${parsed.elevationM}m)`,
          );
          isSyncingGps.value = false;
          return;
        }

        if (latest.routeNote) rideForm.title = latest.routeNote;
        toast.success(
          '✨ Sesi Gowes Asli Tersinkron!',
          `Data dari catatan sesi "${latest.routeNote || 'Sesi Gowes'}" berhasil dimuat.`,
        );
        isSyncingGps.value = false;
        return;
      }
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lng = pos.coords.longitude.toFixed(4);
          const speedKmh = pos.coords.speed
            ? Number((pos.coords.speed * 3.6).toFixed(1))
            : rideForm.avgSpeedKmH;
          if (speedKmh > 0) rideForm.avgSpeedKmH = speedKmh;
          toast.success(
            '📍 GPS HP Terkoneksi!',
            `Posisi realtime terdeteksi di (${lat}, ${lng}). Sesi aktif langsung disinkronkan.`,
          );
          isSyncingGps.value = false;
        },
        () => {
          toast.info(
            'GPS Tersedia',
            'Memakai estimasi rute lokal & telemetri sensor sepeda.',
          );
          isSyncingGps.value = false;
        },
        { enableHighAccuracy: true, timeout: 5000 },
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

const selectedPersona = ref<'athlete' | 'humor' | 'technical' | 'gravel'>(
  'athlete',
);
const isAiGenerating = ref(false);
const isExporting = ref(false);

const aiRecap = ref({
  title: 'Morning Gravel Rush: Menaklukkan Tanjakan Kopi Sentul',
  highlight:
    'Kamu membakar 980 kalori dan menaklukkan elevasi +580m! Output tenaga rata-rata luar biasa stabil.',
  foodEquivalency: '1 porsi Sate Maranggi + Es Kelapa Muda 🍢🥥',
  climbGradeScore: 'Cat 2 Mountain Pass (~6-8%) ⛰️',
  captions: {
    athlete: `🎯 ${initialDistance} km · +${initialElevation}m Elevasi · Avg ${rideForm.avgSpeedKmH} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${initialBike}. #GowesKit #RideFlex #CyclingLife`,
    humor: `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${initialDistance} km dengan tanjakan ${initialElevation}m! Kaki getar pas pesen Sate Maranggi. Kopi dapet, konten dapet! 😂☕ #GowesSantai #GowesKit`,
    technical: `⚙️ Rute: ${initialNote} (${initialDistance} km). Setup drivetrain pada ${initialBike} bekerja mulus di gradien Cat 2 Mountain Pass. Kecepatan rata-rata ${rideForm.avgSpeedKmH} km/h. #BikeSpecs #GowesKit`,
    gravel: `🌲 Jalur off-road Sentul menyajikan pemandangan bukit dan kabut sejuk. Handling ${initialBike} sangat percaya diri melibas bebatuan dan tanah gravel! 🚵 #GravelRide #GowesKit`,
  },
  photoVisualInsight: '',
  trainingInsight: '',
  mechanicTip: `💡 Saran AI Mekanik: Setelah elevasi +${initialElevation}m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.`,
  hashtags: [
    '#GowesKit',
    '#RideFlex',
    '#CyclingIndonesia',
    '#KOMHunter',
    '#SentulLoop',
  ],
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
      toast.success(
        'Foto Dipasang!',
        'Foto dianalisis oleh AI Vision saat meracik cerita.',
      );
    }
  };
  reader.readAsDataURL(file);
}

function handleGpxUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const xml = String(e.target?.result || '');
      const parsed = parseGpxToRoute(xml, file.name.replace(/\.gpx$/i, ''));

      customGpxRoute.value = {
        id: 'custom_gpx',
        name: parsed.name,
        location: 'Rute Solo Pribadi (GPX)',
        distanceKm: parsed.distanceKm,
        elevationM: parsed.elevationM,
        pathD: parsed.pathD,
        waypoints: parsed.waypoints,
      };

      rideForm.selectedRoutePresetId = 'custom_gpx';
      rideForm.title = parsed.name;
      rideForm.distanceKm = parsed.distanceKm;
      rideForm.elevationM = parsed.elevationM;
      rideForm.durationMinutes = parsed.durationMinutes;
      rideForm.avgSpeedKmH = Number(
        (
          parsed.distanceKm / Math.max(parsed.durationMinutes / 60, 0.05)
        ).toFixed(1),
      );
      rideForm.showGpsRoute = true;

      toast.success(
        '✨ Rute GPX Solo Berhasil Dimuat!',
        `${parsed.name} (${parsed.distanceKm} km, +${parsed.elevationM}m)`,
      );
    } catch (err: unknown) {
      toast.error(
        'Gagal Membaca GPX',
        err instanceof Error ? err.message : 'Format file GPX tidak valid.',
      );
    }
  };
  reader.readAsText(file);
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
          cyclistPersona:
            selectedPersona.value === 'technical'
              ? 'gearhead'
              : selectedPersona.value,
          photoBase64: rideForm.customPhotoUrl.startsWith('data:')
            ? rideForm.customPhotoUrl
            : undefined,
          photoMimeType: 'image/jpeg',
        },
      },
    );

    rideForm.title = res.title;
    rideForm.avgSpeedKmH = res.averageSpeedKmh;
    rideForm.caloriesKcal = res.estimatedCaloriesKcal;

    if (res.recommendedTheme && rideForm.bgPreset !== 'custom') {
      rideForm.bgPreset = res.recommendedTheme;
    }

    aiRecap.value = {
      title: res.title,
      highlight: res.highlight,
      foodEquivalency: res.foodEquivalency,
      climbGradeScore: res.climbGradeScore,
      captions: {
        athlete: res.captions.athlete,
        humor: res.captions.humor,
        technical: res.captions.technical,
        gravel:
          res.captions.gravel ||
          `🌲 Petualangan rute ${res.title} sangat berkesan bersama ${rideForm.bikeName || 'sepeda kesayangan'}!`,
      },
      photoVisualInsight: res.photoVisualInsight || '',
      trainingInsight: res.trainingInsight || '',
      mechanicTip: `💡 Saran AI Mekanik: ${res.mechanicTip}`,
      hashtags: res.suggestedHashtags,
    };
    toast.success(
      '✨ Cerita AI Gemini Dihasilkan!',
      'Caption dan analisa performa berhasil diperbarui secara cerdas.',
    );
  } catch {
    toast.info(
      'Mode Offline Heuristic',
      'AI story dihasilkan dari engine lokal.',
    );
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
async function renderCanvas(
  aspectRatio: 'story' | 'post' | 'landscape',
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts) {
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

  const FONT_UI =
    '"Outfit", "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const FONT_MONO = '"JetBrains Mono", "Space Grotesk", monospace';
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

  const defaultColors: [string, string, string] = [
    '#0f2b48',
    '#081726',
    '#020617',
  ];
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
      const scale = Math.max(
        canvas.width / img.width,
        canvas.height / img.height,
      );
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

  // Helper to draw Brand Chip
  const drawBrandChip = (startX: number, startY: number, pillH = 58) => {
    ctx.save();
    ctx.font = `900 28px ${FONT_UI}`;
    const gowesTextW = ctx.measureText('Gowes').width;
    const kitTextW = ctx.measureText('Kit').width;
    const brandPillW = 16 + 42 + 12 + gowesTextW + kitTextW + 36;

    ctx.fillStyle = 'rgba(23, 32, 42, 0.94)';
    ctx.strokeStyle = 'rgba(201, 243, 106, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX, startY, brandPillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();

    const iconBoxX = startX + 10;
    const iconBoxY = startY + (pillH - 42) / 2;
    ctx.save();
    ctx.translate(iconBoxX, iconBoxY);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.roundRect(0, 0, 42, 42, 10);
    ctx.fill();

    const kineticChainringPath = new Path2D(
      'M28 13.5C25.5 10.2 21 8.8 17 10.2C12.2 11.8 9.5 17 11 22C12.5 27 17.5 30 22.8 28.5C26.5 27.2 29.2 23.8 29.5 19.8',
    );
    const velocityArrowPath = new Path2D('M20 15.5L26.5 20L20 24.5');

    ctx.scale(42 / 40, 42 / 40);
    ctx.strokeStyle = '#C9F36A';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(kineticChainringPath);

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.8;
    ctx.stroke(velocityArrowPath);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(17.5, 20, 2.2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    const brandTextStartX = iconBoxX + 42 + 12;
    ctx.font = `800 24px ${FONT_UI}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Gowes', brandTextStartX, startY + pillH / 2);
    ctx.fillStyle = '#C9F36A';
    ctx.fillText('Kit', brandTextStartX + gowesTextW + 2, startY + pillH / 2);

    ctx.restore();
    return brandPillW;
  };

  // Helper to draw Sticker Chip
  const drawStickerChip = (endX: number, startY: number, pillH = 50) => {
    if (rideForm.activeSticker === 'none') return;
    const stickerText = getStickerLabel(rideForm.activeSticker);

    if (stickerText) {
      ctx.save();
      ctx.font = `850 20px ${FONT_UI}`;
      const stickerTextW = ctx.measureText(stickerText).width;
      const stickerPad = 18;
      const stickerPillW = stickerTextW + stickerPad * 2;
      const stickerX = endX - stickerPillW;

      ctx.fillStyle = '#C9F36A';
      ctx.beginPath();
      ctx.roundRect(stickerX, startY, stickerPillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = '#080d19';
      ctx.font = `850 20px ${FONT_UI}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(stickerText, stickerX + stickerPad, startY + pillH / 2);
      ctx.restore();
    }
  };

  // Helper to draw GPS Route Artwork on any sub-box
  const drawGpsRouteArt = (
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    scaleFactor: number,
  ) => {
    if (!rideForm.showGpsRoute || !currentRoute.value) return;
    ctx.save();
    ctx.translate(boxX, boxY);
    ctx.scale(scaleFactor, scaleFactor);

    // Topo isolines
    ctx.strokeStyle = 'rgba(201, 243, 106, 0.14)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    const topo1 = new Path2D(
      'M 40 100 Q 120 40 200 70 T 360 80 Q 380 180 340 260 T 180 300 Q 80 280 40 200 Z',
    );
    const topo2 = new Path2D(
      'M 70 120 Q 140 70 210 90 T 330 110 Q 350 170 310 230 T 190 270 Q 100 250 70 180 Z',
    );
    const topo3 = new Path2D(
      'M 110 140 Q 160 100 220 120 T 290 140 Q 300 180 280 210 T 200 240 Q 140 220 110 180 Z',
    );

    ctx.stroke(topo1);
    ctx.stroke(topo2);
    ctx.stroke(topo3);
    ctx.setLineDash([]);

    // Grid Coordinates & Compass
    ctx.font = `800 10px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(201, 243, 106, 0.75)';
    ctx.fillText('LAT -6°10\'48"S · LON 106°37\'52"E', 40, 24);
    ctx.textAlign = 'right';
    ctx.fillText('🧭 N ▲', 360, 24);
    ctx.textAlign = 'left';

    const routePath = new Path2D(currentRoute.value.pathD);

    // Ambient Glow
    ctx.shadowBlur = 24;
    ctx.shadowColor =
      rideForm.routeRenderStyle === 'kinetic_neon' ? '#C9F36A' : '#38BDF8';
    ctx.lineWidth = 14;
    ctx.strokeStyle =
      rideForm.routeRenderStyle === 'kinetic_neon'
        ? 'rgba(201, 243, 106, 0.35)'
        : 'rgba(56, 189, 248, 0.35)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(routePath);
    ctx.shadowBlur = 0;

    // Asphalt Casing
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#070D18';
    ctx.stroke(routePath);

    // Core Gradient Ribbon
    const routeGrad = ctx.createLinearGradient(50, 50, 350, 300);
    if (rideForm.routeRenderStyle === 'spectrum_elevation') {
      routeGrad.addColorStop(0, '#C9F36A');
      routeGrad.addColorStop(0.35, '#8EDDF4');
      routeGrad.addColorStop(0.7, '#F59E0B');
      routeGrad.addColorStop(1, '#FF8C75');
    } else if (rideForm.routeRenderStyle === 'kinetic_neon') {
      routeGrad.addColorStop(0, '#C9F36A');
      routeGrad.addColorStop(1, '#A3E635');
    } else {
      routeGrad.addColorStop(0, '#38BDF8');
      routeGrad.addColorStop(1, '#00FF66');
    }

    ctx.lineWidth = 4.5;
    ctx.strokeStyle = routeGrad;
    ctx.stroke(routePath);

    // Waypoints
    if (rideForm.showWaypoints && currentRoute.value.waypoints) {
      currentRoute.value.waypoints.forEach((wp) => {
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle =
          wp.type === 'climb'
            ? '#FF8C75'
            : wp.type === 'coffee'
              ? '#F59E0B'
              : '#C9F36A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, 13, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(wp.icon, wp.x, wp.y + 1);

        ctx.font = `800 10px ${FONT_UI}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(wp.name, wp.x, wp.y + 24);
      });
    }

    ctx.restore();
  };

  // =========================================================================
  // CASE 1: LANDSCAPE (16:9 - 1920x1080) SEAMLESS STRAVA-STYLE OVERLAY
  // =========================================================================
  if (isLandscape) {
    // 1. Left Map Layer (Directly floating on background canvas, NO box container!)
    drawGpsRouteArt(80, 110, 840, 740, 2.15);

    // Floating Location Tag at bottom-left
    ctx.save();
    ctx.font = `800 20px ${FONT_UI}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(
      `📍 ${currentRoute.value?.name || 'Rute Gowes'} · +${rideForm.elevationM}m Climb`,
      80,
      960,
    );
    ctx.restore();

    // 2. Right Data Cockpit (Directly floating, NO nested card boxes!)
    const rightX = 1040;
    drawBrandChip(rightX, 70, 48);
    drawStickerChip(canvas.width - 80, 70, 48);

    // Hero Distance
    const distNumberStr = `${rideForm.distanceKm}`;
    ctx.font = `900 128px ${FONT_UI}`;
    ctx.fillStyle = '#C9F36A';
    ctx.fillText(distNumberStr, rightX, 300);

    const distW = ctx.measureText(distNumberStr).width;
    ctx.font = `900 42px ${FONT_UI}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('KM', rightX + distW + 16, 255);

    // Session Title & Specs
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 32px ${FONT_UI}`;
    ctx.fillText(
      rideForm.title.length > 32
        ? `${rideForm.title.slice(0, 30)}…`
        : rideForm.title,
      rightX,
      360,
    );

    ctx.fillStyle = '#94A3B8';
    ctx.font = `600 20px ${FONT_UI}`;
    ctx.fillText(
      `🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`,
      rightX,
      405,
    );

    // Seamless Telemetry Grid (Clean Typography with Subtle Dividers, NO BOXES!)
    const statsStartX = rightX;
    const col2X = rightX + 380;
    const lineWidth = canvas.width - rightX - 80;

    // Divider Line 1
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(statsStartX, 460);
    ctx.lineTo(statsStartX + lineWidth, 460);
    ctx.stroke();

    // Row 1: WAKTU & SPEED
    ctx.fillStyle = '#94A3B8';
    ctx.font = `800 15px ${FONT_UI}`;
    ctx.fillText('WAKTU GOWES', statsStartX, 495);
    ctx.fillText('AVG SPEED', col2X, 495);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 38px ${FONT_UI}`;
    ctx.fillText(formatDuration(rideForm.durationMinutes), statsStartX, 550);

    ctx.fillStyle = '#C9F36A';
    ctx.fillText(`${rideForm.avgSpeedKmH} km/h`, col2X, 550);

    // Divider Line 2
    ctx.beginPath();
    ctx.moveTo(statsStartX, 595);
    ctx.lineTo(statsStartX + lineWidth, 595);
    ctx.stroke();

    // Row 2: CLIMB & KALORI
    ctx.fillStyle = '#94A3B8';
    ctx.font = `800 15px ${FONT_UI}`;
    ctx.fillText('ELEVASI CLIMB', statsStartX, 630);
    ctx.fillText('EST. KALORI', col2X, 630);

    ctx.fillStyle = '#38BDF8';
    ctx.font = `900 38px ${FONT_UI}`;
    ctx.fillText(`+${rideForm.elevationM} m`, statsStartX, 685);

    ctx.fillStyle = '#FF8C75';
    ctx.fillText(`~${rideForm.caloriesKcal} kcal`, col2X, 685);

    // Divider Line 3
    ctx.beginPath();
    ctx.moveTo(statsStartX, 730);
    ctx.lineTo(statsStartX + lineWidth, 730);
    ctx.stroke();

    // Watermark
    ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
    ctx.font = `800 18px ${FONT_UI}`;
    ctx.fillText('⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID', rightX, 785);

    return canvas;
  }

  // =========================================================================
  // CASE 2: SQUARE (1:1 - 1080x1080) SEAMLESS BALANCED FEED POST
  // =========================================================================
  if (!isStory) {
    // 1. Top Bar
    drawBrandChip(60, 50, 48);
    drawStickerChip(canvas.width - 60, 50, 48);

    // 2. Middle Radar Map Stage (Seamless floating, centered, scaled to 1.35!)
    // SVG viewBox is 400x320. At scale 1.35: w = 540, h = 432. Centered at x = 270, y = 130.
    drawGpsRouteArt(270, 130, 540, 440, 1.35);

    // Floating location tag below map (y = 590)
    ctx.save();
    ctx.font = `800 18px ${FONT_UI}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(
      `📍 ${currentRoute.value?.name || 'Rute Gowes'} · +${rideForm.elevationM}m Climb`,
      canvas.width / 2,
      590,
    );
    ctx.restore();

    // 3. Lower Hero Row (y: 630 - 745)
    const heroY = 705;
    const distNumberStr = `${rideForm.distanceKm}`;
    ctx.font = `900 92px ${FONT_UI}`;
    ctx.fillStyle = '#C9F36A';
    ctx.fillText(distNumberStr, 60, heroY);

    const distW = ctx.measureText(distNumberStr).width;
    ctx.font = `900 34px ${FONT_UI}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('KM', 60 + distW + 12, heroY - 22);

    // Session Title (Right side aligned)
    const titleX = Math.max(60 + distW + 90, 360);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `850 28px ${FONT_UI}`;
    const displayTitle =
      rideForm.title.length > 28
        ? `${rideForm.title.slice(0, 26)}…`
        : rideForm.title;
    ctx.fillText(displayTitle, titleX, heroY - 24);

    ctx.fillStyle = '#94A3B8';
    ctx.font = `600 20px ${FONT_UI}`;
    ctx.fillText(
      `🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`,
      titleX,
      heroY + 12,
    );

    // 4. 4-Pill Glass Telemetry Deck (y: 765 - 915)
    const deckX = 60;
    const deckY = 765;
    const deckW = canvas.width - 120;
    const deckH = 150;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(201, 243, 106, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(deckX, deckY, deckW, deckH, 20);
    ctx.fill();
    ctx.stroke();

    const sqMetrics = [
      {
        lbl: 'WAKTU',
        val: formatDuration(rideForm.durationMinutes),
        color: '#FFFFFF',
      },
      {
        lbl: 'AVG SPEED',
        val: `${rideForm.avgSpeedKmH} km/h`,
        color: '#C9F36A',
      },
      { lbl: 'CLIMB', val: `+${rideForm.elevationM}m`, color: '#38BDF8' },
      { lbl: 'KALORI', val: `~${rideForm.caloriesKcal}`, color: '#FF8C75' },
    ];

    const colW = deckW / 4;
    sqMetrics.forEach((stat, idx) => {
      const colX = deckX + idx * colW;

      ctx.fillStyle = '#94A3B8';
      ctx.font = `800 15px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText(stat.lbl, colX + colW / 2, deckY + 45);

      ctx.fillStyle = stat.color;
      ctx.font = `900 36px ${FONT_UI}`;
      ctx.fillText(stat.val, colX + colW / 2, deckY + 105);

      // Divider line
      if (idx < 3) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(colX + colW, deckY + 28);
        ctx.lineTo(colX + colW, deckY + deckH - 28);
        ctx.stroke();
      }
    });

    // 5. Watermark Footer
    ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
    ctx.font = `800 18px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      '⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID',
      canvas.width / 2,
      995,
    );
    ctx.textAlign = 'left';

    return canvas;
  }

  // =========================================================================
  // CASE 3: STORY (9:16 - 1080x1920) VERTICAL MAJESTIC FLOW
  // =========================================================================
  // Vignette
  const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
  vignette.addColorStop(0, 'rgba(6, 10, 18, 0.45)');
  vignette.addColorStop(0.35, 'rgba(6, 10, 18, 0.05)');
  vignette.addColorStop(0.65, 'rgba(6, 10, 18, 0.85)');
  vignette.addColorStop(1, 'rgba(6, 10, 18, 0.98)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Bar
  drawBrandChip(70, 80, 68);
  drawStickerChip(canvas.width - 70, 80, 68);

  // GPS Map Art
  drawGpsRouteArt((canvas.width - 840) / 2, 280, 840, 700, 2.1);

  // Hero Section
  const heroX = 70;
  const heroY = 1190;

  if (rideForm.templateStyle === 'rapha_editorial') {
    ctx.fillStyle = '#FF8C75';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('STAGE 01 · FINISHED ETAPPE', heroX, heroY - 150);
  } else if (rideForm.templateStyle === 'cyber_hud') {
    ctx.fillStyle = '#00FF66';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('GPS: LOCKED (14 SATS) · CAD: 88 RPM', heroX, heroY - 150);
  } else if (rideForm.templateStyle === 'cafe_santai') {
    ctx.fillStyle = '#FDE68A';
    ctx.font = `900 24px ${FONT_UI}`;
    ctx.fillText('☕ RECOVERY MODE · KULINERAN', heroX, heroY - 150);
  }

  const distNumberStr = `${rideForm.distanceKm}`;
  const isSerif = rideForm.templateStyle === 'rapha_editorial';
  ctx.font = isSerif ? `900 160px ${FONT_SERIF}` : `900 160px ${FONT_UI}`;
  ctx.fillStyle =
    rideForm.templateStyle === 'cyber_hud'
      ? '#38BDF8'
      : rideForm.templateStyle === 'cafe_santai'
        ? '#F59E0B'
        : rideForm.templateStyle === 'rapha_editorial'
          ? '#FFFFFF'
          : '#C9F36A';
  ctx.fillText(distNumberStr, heroX, heroY);

  const numWidth = ctx.measureText(distNumberStr).width;
  ctx.font = `900 52px ${FONT_UI}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('KM', heroX + numWidth + 18, heroY - 45);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `850 46px ${FONT_UI}`;
  ctx.fillText(
    rideForm.title.length > 32
      ? `${rideForm.title.slice(0, 30)}…`
      : rideForm.title,
    heroX,
    heroY + 58,
  );

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `600 28px ${FONT_UI}`;
  ctx.fillText(
    `🚴 ${rideForm.bikeName} · ${rideForm.temperatureC}°C Cerah`,
    heroX,
    heroY + 104,
  );

  // Bottom Telemetry Card
  const cardX = 70;
  const cardW = canvas.width - 140;
  const cardY = 1340;
  const cardH = 440;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = 'rgba(201, 243, 106, 0.4)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 36);
  ctx.fill();
  ctx.stroke();

  // Elev Strip Top Row
  const elevRowY = cardY + 55;
  ctx.font = `800 22px ${FONT_UI}`;
  ctx.fillStyle = '#94A3B8';
  ctx.textAlign = 'left';
  ctx.fillText('ELEVASI PROFILE', cardX + 45, elevRowY);

  ctx.font = `900 24px ${FONT_UI}`;
  ctx.fillStyle = '#38BDF8';
  ctx.textAlign = 'right';
  ctx.fillText(`+${rideForm.elevationM}m Climb`, cardX + cardW - 45, elevRowY);
  ctx.textAlign = 'left';

  // Elevation Wave
  const curveStartX = cardX + 45;
  const curveEndX = cardX + cardW - 45;
  const curveY = cardY + 115;

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(curveStartX, curveY + 10);
  ctx.bezierCurveTo(
    curveStartX + (curveEndX - curveStartX) * 0.35,
    curveY + 8,
    curveStartX + (curveEndX - curveStartX) * 0.65,
    curveY - 10,
    curveEndX,
    curveY - 14,
  );
  ctx.stroke();

  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(curveStartX, curveY + 10, 5.5, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#C9F36A';
  ctx.beginPath();
  ctx.arc(curveEndX, curveY - 14, 6.5, 0, 2 * Math.PI);
  ctx.fill();

  // Horizontal Divider Line inside Card
  const dividerY = cardY + 170;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 35, dividerY);
  ctx.lineTo(cardX + cardW - 35, dividerY);
  ctx.stroke();

  // 3 Pillars: Waktu, Speed, Kalori (Centered & Balanced)
  const colWidth = (cardW - 70) / 3;
  const statsTopY = dividerY + 65;
  const statsValY = dividerY + 145;
  const vDivTop = dividerY + 25;
  const vDivBottom = cardY + cardH - 35;

  const statsList = [
    {
      label: 'WAKTU',
      val: formatDuration(rideForm.durationMinutes),
      color: '#FFFFFF',
    },
    { label: 'SPEED', val: `${rideForm.avgSpeedKmH} km/h`, color: '#C9F36A' },
    {
      label: 'KALORI',
      val: `~${rideForm.caloriesKcal} kcal`,
      color: '#FF8C75',
    },
  ];

  statsList.forEach((stat, idx) => {
    const colCenterX = cardX + 35 + idx * colWidth + colWidth / 2;

    ctx.fillStyle = '#94A3B8';
    ctx.font = `800 20px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(stat.label, colCenterX, statsTopY);

    ctx.fillStyle = stat.color;
    ctx.font = `900 44px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(stat.val, colCenterX, statsValY);

    if (idx < 2) {
      const divX = cardX + 35 + (idx + 1) * colWidth;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(divX, vDivTop);
      ctx.lineTo(divX, vDivBottom);
      ctx.stroke();
    }
  });

  ctx.textAlign = 'left';

  // Watermark Footer
  ctx.fillStyle = 'rgba(201, 243, 106, 0.85)';
  ctx.font = `900 24px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText(
    '⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID',
    canvas.width / 2,
    canvas.height - 45,
  );
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
      toast.success(
        'Berhasil Dibagikan!',
        'Poster gowes siap diposting ke medsos.',
      );
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
          :style="
            rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl
              ? { backgroundImage: `url(${rideForm.customPhotoUrl})` }
              : {}
          "
        >
          <!-- Cyber HUD Overlays -->
          <template v-if="rideForm.templateStyle === 'cyber_hud'">
            <div class="hud-corner hud-tl">⌜</div>
            <div class="hud-corner hud-tr">⌝</div>
            <div class="hud-corner hud-bl">⌞</div>
            <div class="hud-corner hud-br">⌟</div>
            <div class="hud-grid-overlay" />
          </template>

          <div class="poster-vignette-layer" />

          <!-- =========================================================
               LAYOUT A: WIDESCREEN BANNER (16:9 Strava-Style Seamless)
               ========================================================= -->
          <template v-if="rideForm.aspectRatio === 'landscape'">
            <div class="banner-strava-shell">
              <!-- Left GPS Route Overlay (Directly over the image, NO card box!) -->
              <div
                v-if="rideForm.showGpsRoute && currentRoute"
                class="banner-seamless-map"
              >
                <svg
                  viewBox="0 0 400 320"
                  class="gps-route-svg"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="spectrumElevationL"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stop-color="#C9F36A" />
                      <stop offset="35%" stop-color="#8EDDF4" />
                      <stop offset="70%" stop-color="#F59E0B" />
                      <stop offset="100%" stop-color="#FF8C75" />
                    </linearGradient>
                    <filter
                      id="routeGlowL"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>

                  <!-- Topo Contours & Coordinates -->
                  <g opacity="0.22">
                    <path
                      d="M 40 100 Q 120 40 200 70 T 360 80 Q 380 180 340 260 T 180 300 Q 80 280 40 200 Z"
                      stroke="#C9F36A"
                      stroke-width="1.2"
                      stroke-dasharray="3 3"
                    />
                    <path
                      d="M 70 120 Q 140 70 210 90 T 330 110 Q 350 170 310 230 T 190 270 Q 100 250 70 180 Z"
                      stroke="#C9F36A"
                      stroke-width="1.5"
                      stroke-dasharray="3 3"
                    />
                    <text
                      x="40"
                      y="24"
                      fill="#C9F36A"
                      font-size="9"
                      font-family="var(--font-mono)"
                      font-weight="800"
                    >
                      LAT -6°10'48"S · LON 106°37'52"E
                    </text>
                    <text
                      x="360"
                      y="24"
                      text-anchor="end"
                      fill="#C9F36A"
                      font-size="9.5"
                      font-family="var(--font-mono)"
                      font-weight="900"
                    >
                      🧭 N ▲
                    </text>
                  </g>

                  <!-- Ambient Glow -->
                  <path
                    :d="currentRoute.pathD"
                    fill="none"
                    :stroke="
                      rideForm.routeRenderStyle === 'kinetic_neon'
                        ? '#C9F36A'
                        : 'url(#spectrumElevationL)'
                    "
                    stroke-width="14"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    opacity="0.4"
                    filter="url(#routeGlowL)"
                  />

                  <!-- Asphalt Casing -->
                  <path
                    :d="currentRoute.pathD"
                    fill="none"
                    stroke="#070D18"
                    stroke-width="9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <!-- Core Ribbon -->
                  <path
                    :d="currentRoute.pathD"
                    fill="none"
                    :stroke="
                      rideForm.routeRenderStyle === 'spectrum_elevation'
                        ? 'url(#spectrumElevationL)'
                        : rideForm.routeRenderStyle === 'kinetic_neon'
                          ? '#C9F36A'
                          : '#38BDF8'
                    "
                    stroke-width="4.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />

                  <!-- Waypoints -->
                  <g v-if="rideForm.showWaypoints && currentRoute.waypoints">
                    <g
                      v-for="(wp, wIdx) in currentRoute.waypoints"
                      :key="wIdx"
                      :transform="`translate(${wp.x}, ${wp.y})`"
                    >
                      <circle
                        r="12"
                        fill="#0F172A"
                        :stroke="
                          wp.type === 'climb'
                            ? '#FF8C75'
                            : wp.type === 'coffee'
                              ? '#F59E0B'
                              : '#C9F36A'
                        "
                        stroke-width="2.5"
                      />
                      <text y="4" text-anchor="middle" font-size="10">
                        {{ wp.icon }}
                      </text>
                      <text
                        y="20"
                        text-anchor="middle"
                        font-size="8.5"
                        font-weight="900"
                        fill="#FFFFFF"
                        font-family="var(--font-sans)"
                      >
                        {{ wp.name }}
                      </text>
                    </g>
                  </g>
                </svg>
                <div class="banner-floating-loc">
                  📍 {{ currentRoute?.name || 'Rute Gowes' }} ·
                  <span class="text-sky"
                    >+{{ rideForm.elevationM }}m Climb</span
                  >
                </div>
              </div>

              <!-- Right Data Cockpit (Directly floating, NO nested card boxes!) -->
              <div class="banner-seamless-data">
                <div class="banner-top-row">
                  <div class="brand-chip-seamless">
                    <div class="brand-mark-mini">
                      <svg
                        viewBox="0 0 40 40"
                        fill="none"
                        width="13"
                        height="13"
                        aria-hidden="true"
                      >
                        <rect width="40" height="40" rx="10" fill="#0F172A" />
                        <path
                          d="M28 13.5C25.5 10.2 21 8.8 17 10.2C12.2 11.8 9.5 17 11 22C12.5 27 17.5 30 22.8 28.5C26.5 27.2 29.2 23.8 29.5 19.8"
                          stroke="#C9F36A"
                          stroke-width="3.2"
                          stroke-linecap="round"
                        />
                        <path
                          d="M20 15.5L26.5 20L20 24.5"
                          stroke="#38BDF8"
                          stroke-width="2.8"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <circle cx="17.5" cy="20" r="2.2" fill="#FFFFFF" />
                      </svg>
                    </div>
                    <span class="brand-text-seamless"
                      >Gowes<span class="brand-kit-accent">Kit</span></span
                    >
                  </div>

                  <div
                    v-if="rideForm.activeSticker !== 'none'"
                    class="sticker-chip-seamless"
                  >
                    {{ getStickerLabel(rideForm.activeSticker) }}
                  </div>
                </div>

                <div class="banner-seamless-hero">
                  <div class="mileage-row">
                    <span class="mileage-val">{{ rideForm.distanceKm }}</span>
                    <span class="mileage-unit">KM</span>
                  </div>
                  <h2 class="session-name">{{ rideForm.title }}</h2>
                  <div class="session-specs">
                    🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C
                    Cerah
                  </div>
                </div>

                <!-- Seamless Telemetry Deck (Clean Typography, NO Card Boxes!) -->
                <div class="banner-telemetry-seamless">
                  <div class="b-stat-block">
                    <span class="b-stat-lbl">WAKTU</span>
                    <strong class="b-stat-val">{{
                      formatDuration(rideForm.durationMinutes)
                    }}</strong>
                  </div>
                  <div class="b-stat-block">
                    <span class="b-stat-lbl">AVG SPEED</span>
                    <strong class="b-stat-val text-lime"
                      >{{ rideForm.avgSpeedKmH }} km/h</strong
                    >
                  </div>
                  <div class="b-stat-block">
                    <span class="b-stat-lbl">CLIMB</span>
                    <strong class="b-stat-val text-sky"
                      >+{{ rideForm.elevationM }}m</strong
                    >
                  </div>
                  <div class="b-stat-block">
                    <span class="b-stat-lbl">KALORI</span>
                    <strong class="b-stat-val text-coral"
                      >~{{ rideForm.caloriesKcal }}</strong
                    >
                  </div>
                </div>

                <div class="banner-watermark-seamless">
                  ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
                </div>
              </div>
            </div>
          </template>

          <!-- =========================================================
               LAYOUT B: SQUARE FEED (1:1 Balanced Square)
               ========================================================= -->
          <template v-else-if="rideForm.aspectRatio === 'post'">
            <div class="square-layout-shell">
              <div class="poster-card-top">
                <div class="brand-chip">
                  <div class="brand-mark-mini">
                    <svg
                      viewBox="0 0 40 40"
                      fill="none"
                      width="13"
                      height="13"
                      aria-hidden="true"
                    >
                      <rect width="40" height="40" rx="10" fill="#0F172A" />
                      <path
                        d="M28 13.5C25.5 10.2 21 8.8 17 10.2C12.2 11.8 9.5 17 11 22C12.5 27 17.5 30 22.8 28.5C26.5 27.2 29.2 23.8 29.5 19.8"
                        stroke="#C9F36A"
                        stroke-width="3.2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M20 15.5L26.5 20L20 24.5"
                        stroke="#38BDF8"
                        stroke-width="2.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle cx="17.5" cy="20" r="2.2" fill="#FFFFFF" />
                    </svg>
                  </div>
                  <span class="brand-text-mini">
                    Gowes<span class="brand-kit-accent">Kit</span>
                  </span>
                </div>
                <div
                  v-if="rideForm.activeSticker !== 'none'"
                  class="sticker-chip"
                >
                  {{ getStickerLabel(rideForm.activeSticker) }}
                </div>
              </div>

              <!-- Center Radar Map Stage (Seamless floating) -->
              <div class="square-map-stage">
                <div
                  v-if="rideForm.showGpsRoute && currentRoute"
                  class="square-svg-wrap"
                >
                  <svg
                    viewBox="0 0 400 320"
                    class="gps-route-svg"
                    fill="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="spectrumElevationS"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stop-color="#C9F36A" />
                        <stop offset="35%" stop-color="#8EDDF4" />
                        <stop offset="70%" stop-color="#F59E0B" />
                        <stop offset="100%" stop-color="#FF8C75" />
                      </linearGradient>
                      <filter
                        id="routeGlowS"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                      >
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite
                          in="SourceGraphic"
                          in2="blur"
                          operator="over"
                        />
                      </filter>
                    </defs>

                    <g opacity="0.2">
                      <path
                        d="M 40 100 Q 120 40 200 70 T 360 80 Q 380 180 340 260 T 180 300 Q 80 280 40 200 Z"
                        stroke="#C9F36A"
                        stroke-width="1.2"
                        stroke-dasharray="3 3"
                      />
                      <path
                        d="M 70 120 Q 140 70 210 90 T 330 110 Q 350 170 310 230 T 190 270 Q 100 250 70 180 Z"
                        stroke="#C9F36A"
                        stroke-width="1.5"
                        stroke-dasharray="3 3"
                      />
                      <text
                        x="40"
                        y="24"
                        fill="#C9F36A"
                        font-size="9"
                        font-family="var(--font-mono)"
                        font-weight="800"
                      >
                        LAT -6°10'48"S · LON 106°37'52"E
                      </text>
                      <text
                        x="360"
                        y="24"
                        text-anchor="end"
                        fill="#C9F36A"
                        font-size="9.5"
                        font-family="var(--font-mono)"
                        font-weight="900"
                      >
                        🧭 N ▲
                      </text>
                    </g>

                    <path
                      :d="currentRoute.pathD"
                      fill="none"
                      :stroke="
                        rideForm.routeRenderStyle === 'kinetic_neon'
                          ? '#C9F36A'
                          : 'url(#spectrumElevationS)'
                      "
                      stroke-width="14"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      opacity="0.4"
                      filter="url(#routeGlowS)"
                    />
                    <path
                      :d="currentRoute.pathD"
                      fill="none"
                      stroke="#070D18"
                      stroke-width="9"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      :d="currentRoute.pathD"
                      fill="none"
                      :stroke="
                        rideForm.routeRenderStyle === 'spectrum_elevation'
                          ? 'url(#spectrumElevationS)'
                          : rideForm.routeRenderStyle === 'kinetic_neon'
                            ? '#C9F36A'
                            : '#38BDF8'
                      "
                      stroke-width="4.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />

                    <g v-if="rideForm.showWaypoints && currentRoute.waypoints">
                      <g
                        v-for="(wp, wIdx) in currentRoute.waypoints"
                        :key="wIdx"
                        :transform="`translate(${wp.x}, ${wp.y})`"
                      >
                        <circle
                          r="12"
                          fill="#0F172A"
                          :stroke="
                            wp.type === 'climb'
                              ? '#FF8C75'
                              : wp.type === 'coffee'
                                ? '#F59E0B'
                                : '#C9F36A'
                          "
                          stroke-width="2.5"
                        />
                        <text y="4" text-anchor="middle" font-size="10">
                          {{ wp.icon }}
                        </text>
                        <text
                          y="20"
                          text-anchor="middle"
                          font-size="8.5"
                          font-weight="900"
                          fill="#FFFFFF"
                          font-family="var(--font-sans)"
                        >
                          {{ wp.name }}
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>
                <div class="square-floating-loc">
                  📍 {{ currentRoute?.name || 'Rute Gowes' }} · +{{
                    rideForm.elevationM
                  }}m
                </div>
              </div>

              <!-- Bottom Content: Hero Left + 4-Metric Deck -->
              <div class="square-bottom-deck">
                <div class="square-hero-row">
                  <div class="mileage-row">
                    <span class="mileage-val">{{ rideForm.distanceKm }}</span>
                    <span class="mileage-unit">KM</span>
                  </div>
                  <div class="square-title-group">
                    <h2 class="session-name">{{ rideForm.title }}</h2>
                    <div class="session-specs">
                      🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C
                      Cerah
                    </div>
                  </div>
                </div>

                <div class="square-metrics-row">
                  <div class="sq-pill">
                    <span class="sq-lbl">WAKTU</span>
                    <strong class="sq-val">{{
                      formatDuration(rideForm.durationMinutes)
                    }}</strong>
                  </div>
                  <div class="sq-div" />
                  <div class="sq-pill">
                    <span class="sq-lbl">AVG SPEED</span>
                    <strong class="sq-val text-lime"
                      >{{ rideForm.avgSpeedKmH }} km/h</strong
                    >
                  </div>
                  <div class="sq-div" />
                  <div class="sq-pill">
                    <span class="sq-lbl">CLIMB</span>
                    <strong class="sq-val text-sky"
                      >+{{ rideForm.elevationM }}m</strong
                    >
                  </div>
                  <div class="sq-div" />
                  <div class="sq-pill">
                    <span class="sq-lbl">KALORI</span>
                    <strong class="sq-val text-coral"
                      >~{{ rideForm.caloriesKcal }}</strong
                    >
                  </div>
                </div>
              </div>

              <div class="poster-watermark watermark-center">
                ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
              </div>
            </div>
          </template>

          <!-- =========================================================
               LAYOUT C: STORY (9:16 Vertical Majestic)
               ========================================================= -->
          <template v-else>
            <!-- Dynamic GowesKit Signature GPS Route Ribbon Canvas / SVG Layer -->
            <div
              v-if="rideForm.showGpsRoute && currentRoute"
              class="gps-route-art-layer"
            >
              <svg
                viewBox="0 0 400 350"
                class="gps-route-svg"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="spectrumElevation"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stop-color="#C9F36A" />
                    <stop offset="35%" stop-color="#8EDDF4" />
                    <stop offset="70%" stop-color="#F59E0B" />
                    <stop offset="100%" stop-color="#FF8C75" />
                  </linearGradient>
                  <filter
                    id="routeGlow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                <!-- Topographic Contour Loops & Map Coordinate Mesh -->
                <g opacity="0.18">
                  <path
                    d="M 40 100 Q 120 40 200 70 T 360 80 Q 380 180 340 260 T 180 300 Q 80 280 40 200 Z"
                    stroke="#C9F36A"
                    stroke-width="1.2"
                    stroke-dasharray="3 3"
                  />
                  <path
                    d="M 70 120 Q 140 70 210 90 T 330 110 Q 350 170 310 230 T 190 270 Q 100 250 70 180 Z"
                    stroke="#C9F36A"
                    stroke-width="1.5"
                    stroke-dasharray="3 3"
                  />
                  <path
                    d="M 110 140 Q 160 100 220 120 T 290 140 Q 300 180 280 210 T 200 240 Q 140 220 110 180 Z"
                    stroke="#C9F36A"
                    stroke-width="1.2"
                    stroke-dasharray="4 4"
                  />
                  <line
                    x1="40"
                    y1="40"
                    x2="360"
                    y2="40"
                    stroke="rgba(255,255,255,0.06)"
                    stroke-width="1"
                  />
                  <line
                    x1="40"
                    y1="310"
                    x2="360"
                    y2="310"
                    stroke="rgba(255,255,255,0.06)"
                    stroke-width="1"
                  />
                  <text
                    x="40"
                    y="24"
                    fill="#C9F36A"
                    font-size="9"
                    font-family="var(--font-mono)"
                    font-weight="800"
                  >
                    LAT -6°10'48"S · LON 106°37'52"E
                  </text>
                  <text
                    x="360"
                    y="24"
                    text-anchor="end"
                    fill="#C9F36A"
                    font-size="9.5"
                    font-family="var(--font-mono)"
                    font-weight="900"
                  >
                    🧭 N ▲
                  </text>
                </g>

                <!-- Outer Glowing Ambient Track -->
                <path
                  :d="currentRoute.pathD"
                  fill="none"
                  :stroke="
                    rideForm.routeRenderStyle === 'kinetic_neon'
                      ? '#C9F36A'
                      : 'url(#spectrumElevation)'
                  "
                  stroke-width="14"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  opacity="0.35"
                  filter="url(#routeGlow)"
                />

                <!-- Road Base Casing (Black Asphalt Foundation) -->
                <path
                  :d="currentRoute.pathD"
                  fill="none"
                  stroke="#070D18"
                  stroke-width="9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Core Vibrant Route Ribbon -->
                <path
                  :d="currentRoute.pathD"
                  fill="none"
                  :stroke="
                    rideForm.routeRenderStyle === 'spectrum_elevation'
                      ? 'url(#spectrumElevation)'
                      : rideForm.routeRenderStyle === 'kinetic_neon'
                        ? '#C9F36A'
                        : '#38BDF8'
                  "
                  stroke-width="4.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Checkpoint & Pitstop Waypoints -->
                <g v-if="rideForm.showWaypoints && currentRoute.waypoints">
                  <g
                    v-for="(wp, wIdx) in currentRoute.waypoints"
                    :key="wIdx"
                    :transform="`translate(${wp.x}, ${wp.y})`"
                  >
                    <circle
                      r="13"
                      fill="#0F172A"
                      :stroke="
                        wp.type === 'climb'
                          ? '#FF8C75'
                          : wp.type === 'coffee'
                            ? '#F59E0B'
                            : '#C9F36A'
                      "
                      stroke-width="2.5"
                    />
                    <text y="4" text-anchor="middle" font-size="11">
                      {{ wp.icon }}
                    </text>
                    <text
                      y="22"
                      text-anchor="middle"
                      font-size="9"
                      font-weight="900"
                      fill="#FFFFFF"
                      font-family="var(--font-sans)"
                    >
                      {{ wp.name }}
                    </text>
                  </g>
                </g>
              </svg>
            </div>

            <!-- Official GowesKit Brand Pill & Achievement Sticker -->
            <div class="poster-card-top">
              <div class="brand-chip">
                <div class="brand-mark-mini">
                  <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    width="13"
                    height="13"
                    aria-hidden="true"
                  >
                    <rect width="40" height="40" rx="10" fill="#0F172A" />
                    <path
                      d="M28 13.5C25.5 10.2 21 8.8 17 10.2C12.2 11.8 9.5 17 11 22C12.5 27 17.5 30 22.8 28.5C26.5 27.2 29.2 23.8 29.5 19.8"
                      stroke="#C9F36A"
                      stroke-width="3.2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M20 15.5L26.5 20L20 24.5"
                      stroke="#38BDF8"
                      stroke-width="2.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle cx="17.5" cy="20" r="2.2" fill="#FFFFFF" />
                  </svg>
                </div>
                <span class="brand-text-mini">
                  Gowes<span class="brand-kit-accent">Kit</span>
                </span>
              </div>

              <div
                v-if="rideForm.activeSticker !== 'none'"
                class="sticker-chip"
              >
                {{ getStickerLabel(rideForm.activeSticker) }}
              </div>
            </div>

            <!-- Poster Hero Typography -->
            <div class="poster-card-center">
              <div
                v-if="rideForm.templateStyle === 'rapha_editorial'"
                class="rapha-etappe-tag"
              >
                STAGE 01 · FINISHED ETAPPE
              </div>
              <div
                v-else-if="rideForm.templateStyle === 'cyber_hud'"
                class="cyber-telemetry-tag"
              >
                GPS: LOCKED (14 SATS) · CAD: 88 RPM
              </div>
              <div
                v-else-if="rideForm.templateStyle === 'cafe_santai'"
                class="cafe-fuel-tag"
              >
                ☕ RECOVERY MODE · KULINERAN
              </div>

              <div class="mileage-row">
                <span class="mileage-val">{{ rideForm.distanceKm }}</span>
                <span class="mileage-unit">KM</span>
              </div>
              <h2 class="session-name">{{ rideForm.title }}</h2>
              <div class="session-specs">
                🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C Cerah
              </div>
            </div>

            <!-- Poster Glass Telemetry Strip -->
            <div class="poster-card-glass">
              <div class="elev-strip">
                <span class="elev-lbl">ELEVASI PROFILE</span>
                <span class="elev-val">+{{ rideForm.elevationM }}m Climb</span>
              </div>
              <svg
                viewBox="0 0 300 24"
                class="elev-curve-svg"
                aria-hidden="true"
              >
                <path
                  d="M0 20 Q 70 18, 140 8 T 260 5 L 300 2"
                  fill="none"
                  :stroke="
                    rideForm.templateStyle === 'cafe_santai'
                      ? '#F59E0B'
                      : rideForm.templateStyle === 'rapha_editorial'
                        ? '#FF8C75'
                        : '#38BDF8'
                  "
                  stroke-width="2.8"
                  stroke-linecap="round"
                />
                <circle
                  cx="0"
                  cy="20"
                  r="2.5"
                  :fill="
                    rideForm.templateStyle === 'cafe_santai'
                      ? '#F59E0B'
                      : '#38BDF8'
                  "
                />
                <circle
                  cx="300"
                  cy="2"
                  r="3.5"
                  :fill="
                    rideForm.templateStyle === 'cafe_santai'
                      ? '#FDE68A'
                      : rideForm.templateStyle === 'rapha_editorial'
                        ? '#FFD1C9'
                        : '#C9F36A'
                  "
                />
              </svg>

              <div class="pillars-row">
                <div class="p-col">
                  <span class="p-lbl">WAKTU</span>
                  <strong class="p-val">{{
                    formatDuration(rideForm.durationMinutes)
                  }}</strong>
                </div>
                <div class="p-div" />
                <div class="p-col">
                  <span class="p-lbl">SPEED</span>
                  <strong
                    class="p-val"
                    :class="
                      rideForm.templateStyle === 'cafe_santai'
                        ? 'text-amber'
                        : rideForm.templateStyle === 'rapha_editorial'
                          ? 'text-coral'
                          : 'text-lime'
                    "
                    >{{ rideForm.avgSpeedKmH }} km/h</strong
                  >
                </div>
                <div class="p-div" />
                <div class="p-col">
                  <span class="p-lbl">KALORI</span>
                  <strong class="p-val text-coral"
                    >~{{ rideForm.caloriesKcal }} kcal</strong
                  >
                </div>
              </div>
            </div>

            <div class="poster-watermark">
              ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
            </div>
          </template>
        </div>

        <!-- Aspect Ratio Controls -->
        <div
          class="aspect-ratio-segmented"
          role="tablist"
          aria-label="Pilihan Rasio Flex"
        >
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
            <GIcon name="palette" size="xs" color="var(--color-chain-lime)" />
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
            <GIcon
              name="bolt"
              size="xs"
              filled
              color="var(--color-chain-lime)"
            />
            <span>Caption AI</span>
          </button>
          <button
            type="button"
            class="tool-menu-btn"
            :class="{ active: activeTool === 'edit' }"
            @click="activeTool = 'edit'"
          >
            <GIcon name="wrench" size="xs" />
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
              <span class="chip-card-tag"
                ><GIcon name="bolt" size="xs" filled color="#C9F36A" />
                BOLD</span
              >
              <strong>Strava Pro</strong>
              <small>Kinetic Neon Green</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'rapha_editorial' }"
              @click="rideForm.templateStyle = 'rapha_editorial'"
            >
              <span class="chip-card-tag"
                ><GIcon name="mountain" size="xs" color="#FF8C75" />
                CLASSIC</span
              >
              <strong>Rapha Editorial</strong>
              <small>Serif &amp; Clean GPS</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
              @click="rideForm.templateStyle = 'cyber_hud'"
            >
              <span class="chip-card-tag"
                ><GIcon name="radar" size="xs" color="#38BDF8" /> CYBER</span
              >
              <strong>Cyber Telemetry</strong>
              <small>HUD Grid &amp; Sensor</small>
            </button>
            <button
              type="button"
              class="chip-card"
              :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
              @click="rideForm.templateStyle = 'cafe_santai'"
            >
              <span class="chip-card-tag"
                ><GIcon name="coffee" size="xs" color="#F59E0B" /> COFFEE</span
              >
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
                :class="{
                  active: rideForm.routeRenderStyle === 'spectrum_elevation',
                }"
                @click="rideForm.routeRenderStyle = 'spectrum_elevation'"
              >
                <GIcon name="route" size="xs" />
                <span>Gradien Elevasi</span>
              </button>
              <button
                type="button"
                class="r-style-btn"
                :class="{
                  active: rideForm.routeRenderStyle === 'kinetic_neon',
                }"
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
                :class="{
                  active: rideForm.routeRenderStyle === 'minimal_wire',
                }"
                @click="rideForm.routeRenderStyle = 'minimal_wire'"
              >
                <GIcon name="map" size="xs" />
                <span>Minimal Outline</span>
              </button>
            </div>

            <!-- Live Sync Button in Route Tab -->
            <button
              type="button"
              class="btn-sync-full"
              :disabled="isSyncingGps"
              @click="syncFromDeviceGpsOrSession"
            >
              <GIcon name="radar" size="sm" color="var(--color-chain-lime)" />
              <span>{{
                isSyncingGps
                  ? 'Menyambungkan GPS...'
                  : '📡 Tarik Jejak GPS Sesi Solo / HP'
              }}</span>
            </button>

            <!-- Iconic Route Presets & Custom Uploaded Route -->
            <div class="route-presets-list">
              <div
                v-if="customGpxRoute"
                class="preset-item-card active-custom"
                :class="{
                  active: rideForm.selectedRoutePresetId === 'custom_gpx',
                }"
                @click="rideForm.selectedRoutePresetId = 'custom_gpx'"
              >
                <div class="preset-icon-col">
                  <GIcon name="navigation" size="sm" color="#38BDF8" />
                </div>
                <div class="preset-info-col">
                  <strong>📍 {{ customGpxRoute.name }}</strong>
                  <small
                    >{{ customGpxRoute.location }} ·
                    {{ customGpxRoute.distanceKm }} km · +{{
                      customGpxRoute.elevationM
                    }}m</small
                  >
                </div>
                <div
                  v-if="rideForm.selectedRoutePresetId === 'custom_gpx'"
                  class="preset-active-check"
                >
                  <GIcon name="check" size="xs" color="#080d19" />
                </div>
              </div>

              <div
                v-for="preset in ROUTE_PRESETS"
                :key="preset.id"
                class="preset-item-card"
                :class="{
                  active: rideForm.selectedRoutePresetId === preset.id,
                }"
                @click="selectRoutePreset(preset)"
              >
                <div class="preset-icon-col">
                  <GIcon
                    name="route"
                    size="sm"
                    color="var(--color-chain-lime)"
                  />
                </div>
                <div class="preset-info-col">
                  <strong>{{ preset.name }}</strong>
                  <small
                    >{{ preset.location }} · {{ preset.distanceKm }} km · +{{
                      preset.elevationM
                    }}m</small
                  >
                </div>
                <div
                  v-if="rideForm.selectedRoutePresetId === preset.id"
                  class="preset-active-check"
                >
                  <GIcon name="check" size="xs" color="#080d19" />
                </div>
              </div>
            </div>

            <!-- GPX Import CTA -->
            <label class="btn-upload-clean">
              <input
                type="file"
                accept=".gpx,.geojson"
                class="sr-only"
                @change="handleGpxUpload"
              />
              <GIcon name="route" size="xs" />
              <span>📂 Unggah File GPX (.gpx) dari Garmin / Strava</span>
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
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handlePhotoUpload"
              />
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
              <GIcon name="trophy" size="xs" color="#EAB308" filled /> KOM
              Hunter
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
              :class="{ active: rideForm.activeSticker === 'power' }"
              @click="rideForm.activeSticker = 'power'"
            >
              <GIcon name="bolt" size="xs" color="#F59E0B" /> 245W Power
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'gradient' }"
              @click="rideForm.activeSticker = 'gradient'"
            >
              <GIcon name="mountain" size="xs" color="#EF4444" /> 18.5% Gradient
            </button>
            <button
              type="button"
              class="sticker-pill"
              :class="{ active: rideForm.activeSticker === 'hr' }"
              @click="rideForm.activeSticker = 'hr'"
            >
              <GIcon name="heart" size="xs" color="#EC4899" filled /> 158 BPM
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
                class="persona-tag"
                :class="{ active: selectedPersona === 'gravel' }"
                @click="selectedPersona = 'gravel'"
              >
                <GIcon name="mountain" size="xs" />
                <span>Gravel</span>
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

            <!-- AI Multimodal Photo Vision Insight (If available) -->
            <div v-if="aiRecap.photoVisualInsight" class="ai-insight-box">
              <span class="ai-insight-label">👁️ AI Vision Insight:</span>
              <p class="ai-insight-text">{{ aiRecap.photoVisualInsight }}</p>
            </div>

            <div class="ai-caption-card">
              <p class="ai-caption-body">
                {{ aiRecap.captions[selectedPersona] }}
              </p>
              <button
                type="button"
                class="btn-copy-clean"
                @click="copyCaption(aiRecap.captions[selectedPersona] || '')"
              >
                <GIcon name="bookmark" size="xs" />
                <span>Salin Caption &amp; Tagar</span>
              </button>
            </div>

            <!-- AI Telemetry Training Coach Insight (If available) -->
            <div v-if="aiRecap.trainingInsight" class="ai-coach-box">
              <span class="ai-coach-label">⚡ AI Training Coach:</span>
              <p class="ai-coach-text">{{ aiRecap.trainingInsight }}</p>
            </div>

            <div class="culinary-clean-tag">
              <GIcon name="coffee" size="xs" color="#F59E0B" />
              <span>{{ aiRecap.foodEquivalency }}</span>
            </div>

            <!-- Interactive Elevation Profile Chart -->
            <ElevationProfileChart
              :distance-km="rideForm.distanceKm"
              :elevation-gain-m="rideForm.elevationM"
              :climb-category="aiRecap.climbGradeScore"
            />
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
              <span>{{
                isSyncingGps
                  ? 'Menyambungkan GPS...'
                  : 'Tarik Data Sesi Gowes Asli / GPS Saya'
              }}</span>
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
              <input
                v-model.number="rideForm.distanceKm"
                type="number"
                step="0.1"
              />
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
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(201, 243, 106, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  background-size: cover;
  background-position: center;
  transition: all 180ms ease;
}

.aspect--post {
  aspect-ratio: 1 / 1 !important;
  max-width: 23rem !important;
  padding: 0.85rem 0.95rem 0.75rem !important;
}

.aspect--landscape {
  aspect-ratio: 16 / 9 !important;
  max-width: 32rem !important;
  padding: 0.75rem 1rem !important;
}

/* ========================================================
   WIDESCREEN BANNER (16:9) SEAMLESS STRAVA-STYLE
   ======================================================== */
.banner-strava-shell {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  align-items: center;
}

.banner-seamless-map {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.banner-floating-loc {
  font-family: var(--font-ui);
  font-size: 0.48rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: auto;
}

.banner-seamless-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 0.1rem 0;
}

.banner-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.brand-chip-seamless {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(201, 243, 106, 0.4);
  padding: 0.15rem 0.45rem 0.15rem 0.25rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.brand-text-seamless {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  color: #ffffff;
  white-space: nowrap;
}

.brand-kit-accent {
  color: var(--color-chain-lime);
}

.sticker-chip-seamless {
  font-family: var(--font-ui);
  font-size: 0.46rem;
  font-weight: 850;
  color: #080d19;
  background: var(--color-chain-lime);
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  white-space: nowrap;
}

.banner-seamless-hero {
  margin: auto 0 0.15rem;
}

.banner-seamless-hero .mileage-val {
  font-size: 1.75rem !important;
  line-height: 0.88;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.banner-seamless-hero .mileage-unit {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
  margin-left: 0.15rem;
}

.banner-seamless-hero .session-name {
  font-size: 0.64rem;
  font-weight: 800;
  margin-top: 0.1rem;
  color: #ffffff;
  line-height: 1.2;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.banner-seamless-hero .session-specs {
  font-size: 0.48rem;
  color: #94a3b8;
  margin-top: 0.05rem;
}

/* Seamless Typographic Telemetry - NO BOXES! */
.banner-telemetry-seamless {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 0.18rem;
  column-gap: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0;
  margin: 0.15rem 0;
}

.b-stat-block {
  display: flex;
  flex-direction: column;
}

.b-stat-lbl {
  font-family: var(--font-ui);
  font-size: 0.38rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.b-stat-val {
  font-family: var(--font-ui);
  font-size: 0.64rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
}

.banner-watermark-seamless {
  text-align: left;
  font-family: var(--font-ui);
  font-size: 0.38rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgba(201, 243, 106, 0.85);
  margin-top: 0.08rem;
}

/* ========================================================
   SQUARE (1:1) BALANCED FEED STYLING
   ======================================================== */
.square-layout-shell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  position: relative;
  z-index: 2;
}

.square-map-stage {
  position: relative;
  width: 100%;
  height: 48%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin: 0.2rem 0;
}

.square-svg-wrap {
  width: 100%;
  height: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.square-floating-loc {
  font-family: var(--font-ui);
  font-size: 0.46rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  text-align: center;
  margin-top: auto;
}

.square-bottom-deck {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.square-hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.square-hero-row .mileage-val {
  font-size: 1.85rem !important;
  line-height: 0.9;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.square-hero-row .mileage-unit {
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffffff;
}

.square-title-group {
  flex: 1;
  text-align: right;
  overflow: hidden;
}

.square-title-group .session-name {
  font-size: 0.68rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.square-title-group .session-specs {
  font-size: 0.5rem;
  color: #94a3b8;
  margin-top: 0.05rem;
}

.square-metrics-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 0.65rem;
  padding: 0.25rem 0.4rem;
}

.sq-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.sq-div {
  width: 1px;
  height: 1.1rem;
  background: rgba(255, 255, 255, 0.1);
}

.sq-lbl {
  font-family: var(--font-ui);
  font-size: 0.36rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.sq-val {
  font-family: var(--font-ui);
  font-size: 0.66rem;
  font-weight: 900;
  line-height: 1.1;
  color: #f8fafc;
}

.text-sky {
  color: #38bdf8;
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
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(255, 140, 117, 0.1);
}

.theme--rapha_editorial .mileage-val {
  font-family: Georgia, serif;
  color: #ffffff;
}

.theme--rapha_editorial .mileage-unit {
  color: #ff8c75;
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
  color: #ff8c75;
  margin-bottom: 0.2rem;
}

.theme--cyber_hud {
  font-family: var(--font-ui);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(56, 189, 248, 0.15);
}

.theme--cyber_hud .mileage-val {
  color: #38bdf8;
  text-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
}

.theme--cyber_hud .mileage-unit {
  color: #00ff66;
}

.theme--cyber_hud .session-name {
  color: #38bdf8;
}

.theme--cyber_hud .poster-card-glass {
  border: 1px solid rgba(56, 189, 248, 0.5);
  background: rgba(6, 18, 38, 0.94);
}

.cyber-telemetry-tag {
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 900;
  color: #00ff66;
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

.hud-tl {
  top: 0.5rem;
  left: 0.5rem;
}
.hud-tr {
  top: 0.5rem;
  right: 0.5rem;
}
.hud-bl {
  bottom: 0.5rem;
  left: 0.5rem;
}
.hud-br {
  bottom: 0.5rem;
  right: 0.5rem;
}

.hud-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

.theme--cafe_santai {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow:
    0 20px 50px -10px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(245, 158, 11, 0.15);
}

.theme--cafe_santai .mileage-val {
  color: #f59e0b;
  text-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
}

.theme--cafe_santai .mileage-unit {
  color: #fde68a;
}

.theme--cafe_santai .poster-card-glass {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(30, 18, 10, 0.94);
}

.cafe-fuel-tag {
  font-size: 0.58rem;
  font-weight: 900;
  color: #fde68a;
  margin-bottom: 0.2rem;
}

/* Background Presets */
.bg--alpine {
  background:
    linear-gradient(
      180deg,
      rgba(8, 23, 38, 0.85) 0%,
      rgba(2, 6, 23, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 15%,
      rgba(56, 189, 248, 0.35) 0%,
      transparent 60%
    ),
    #0f2b48;
}

.bg--gravel {
  background:
    linear-gradient(
      180deg,
      rgba(10, 35, 20, 0.85) 0%,
      rgba(2, 10, 5, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 15%,
      rgba(201, 243, 106, 0.3) 0%,
      transparent 60%
    ),
    #143823;
}

.bg--sunset {
  background:
    linear-gradient(
      180deg,
      rgba(59, 13, 6, 0.85) 0%,
      rgba(15, 4, 2, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 20%,
      rgba(251, 146, 60, 0.45) 0%,
      transparent 65%
    ),
    #581c10;
}

.bg--crit {
  background:
    linear-gradient(
      180deg,
      rgba(33, 5, 51, 0.85) 0%,
      rgba(8, 1, 13, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 15%,
      rgba(168, 85, 247, 0.4) 0%,
      transparent 60%
    ),
    #3b1154;
}

.bg--cafe {
  background:
    linear-gradient(
      180deg,
      rgba(35, 17, 6, 0.85) 0%,
      rgba(13, 6, 2, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 20%,
      rgba(217, 119, 6, 0.35) 0%,
      transparent 60%
    ),
    #3d2111;
}

.bg--topo {
  background:
    linear-gradient(
      180deg,
      rgba(8, 13, 25, 0.85) 0%,
      rgba(3, 6, 10, 0.98) 100%
    ),
    radial-gradient(
      circle at 50% 15%,
      rgba(201, 243, 106, 0.22) 0%,
      transparent 60%
    ),
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
  color: #ffffff;
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

.text-lime {
  color: var(--color-chain-lime);
}
.text-amber {
  color: #f59e0b;
}
.text-coral {
  color: #ff8c75;
}

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

.preset-item-card.active-custom {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.08);
}

.preset-item-card.active-custom.active {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
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

.ai-insight-box {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 0.75rem;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ai-insight-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #38bdf8;
  letter-spacing: 0.03em;
}

.ai-insight-text {
  margin: 0;
  font-size: 0.75rem;
  color: #e0f2fe;
  line-height: 1.4;
}

.ai-coach-box {
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 0.75rem;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ai-coach-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #facc15;
  letter-spacing: 0.03em;
}

.ai-coach-text {
  margin: 0;
  font-size: 0.75rem;
  color: #fef08a;
  line-height: 1.4;
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
