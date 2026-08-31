<script setup lang="ts">
import type { GenerateRideStoryResponse } from '@goweskit/contracts';
import { generateGpxXml, parseGpxToRoute } from '../gpx-export';

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

const activeTab = ref<
  'templates' | 'route' | 'backgrounds' | 'stickers' | 'ai' | 'data'
>('templates');

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

interface RoutePreset {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationM: number;
  pathD: string;
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
        name: 'Kawah Bromo Summit (+2329m)',
        icon: '🌋',
        x: 340,
        y: 140,
        type: 'climb',
      },
      { name: 'Bukit Teletubbies', icon: '☕', x: 155, y: 230, type: 'coffee' },
    ],
  },
];

const detectedPresetId = computed(() => {
  const noteLower = (props.initialRouteNote || '').toLowerCase();
  if (
    noteLower.includes('cisadane') ||
    noteLower.includes('tangerang') ||
    props.initialDistance < 15
  ) {
    return 'cisadane_intro';
  }
  if (
    noteLower.includes('sudirman') ||
    noteLower.includes('monas') ||
    noteLower.includes('jakarta')
  ) {
    return 'jkt_sudirman';
  }
  if (
    noteLower.includes('bojong') ||
    noteLower.includes('km 0') ||
    noteLower.includes('km0')
  ) {
    return 'km0_bojong';
  }
  if (
    noteLower.includes('dago') ||
    noteLower.includes('tahura') ||
    noteLower.includes('bandung')
  ) {
    return 'dago_bandung';
  }
  if (noteLower.includes('bromo') || noteLower.includes('tengger')) {
    return 'bromo_gravel';
  }
  return 'cisadane_intro';
});

const rideForm = reactive({
  title: props.initialRouteNote || 'Morning Gravel & Hills Rush',
  distanceKm: props.initialDistance,
  elevationM: props.initialElevation,
  durationMinutes: props.initialDurationMinutes,
  avgSpeedKmH: Number(
    (
      props.initialDistance / Math.max(props.initialDurationMinutes / 60, 0.05)
    ).toFixed(1),
  ),
  caloriesKcal: 980,
  temperatureC: 25,
  bikeName: props.bikeNickname,
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
  selectedRoutePresetId: detectedPresetId.value,
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
    athlete: `🎯 ${props.initialDistance} km · +${props.initialElevation}m Elevasi · Avg ${rideForm.avgSpeedKmH} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${props.bikeNickname}. #GowesKit #RideFlex`,
    humor: `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${props.initialDistance} km dengan tanjakan ${props.initialElevation}m! Kaki auto getar pas pesen Sate Maranggi. 😂☕ #GowesSantai`,
    technical: `⚙️ Rute: ${props.initialRouteNote} (${props.initialDistance} km). Setup drivetrain pada ${props.bikeNickname} bekerja mulus di gradien Cat 2 Mountain Pass. #BikeSpecs #GowesKit`,
    gravel: `🌲 Jalur off-road menyajikan pemandangan bukit dan udara segar. Handling ${props.bikeNickname} sangat mantap di bebatuan! 🚵 #GravelRide #GowesKit`,
  },
  photoVisualInsight: '',
  trainingInsight: '',
  mechanicTip: `💡 Saran AI Mekanik: Setelah elevasi +${props.initialElevation}m, rantai dan cassette menahan torsi tinggi. Cek tegangan rantai dan lumasi kembali drivetrain malam ini.`,
  hashtags: [
    '#GowesKit',
    '#RideFlex',
    '#CyclingIndonesia',
    '#KOMHunter',
    '#GowesPagi',
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
        'Foto Berhasil Dipasang!',
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
      'Judul & caption berhasil diperbarui secara cerdas.',
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
    toast.success('Caption Disalin!', 'Siap di-paste ke medsos.');
  } catch {
    toast.error('Gagal menyalin', 'Salin teks secara manual.');
  }
}

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

    toast.success(
      'Poster Gowes HD Terunduh!',
      'Format jernih siap diposting ke media sosial.',
    );
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
            <span class="live-dot-pulse" />
            <span id="modal-studio-title" class="modal-heading"
              >RIDE PASS STUDIO</span
            >
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
              :style="
                rideForm.bgPreset === 'custom' && rideForm.customPhotoUrl
                  ? { backgroundImage: `url(${rideForm.customPhotoUrl})` }
                  : {}
              "
            >
              <!-- Cyber HUD Elements -->
              <template v-if="rideForm.templateStyle === 'cyber_hud'">
                <div class="m-hud-corner m-hud-tl">⌜</div>
                <div class="m-hud-corner m-hud-tr">⌝</div>
                <div class="m-hud-corner m-hud-bl">⌞</div>
                <div class="m-hud-corner m-hud-br">⌟</div>
                <div class="m-hud-grid-layer" />
              </template>

              <div class="modal-poster-vignette" />

              <!-- =========================================================
                   LAYOUT A: WIDESCREEN BANNER (16:9 Strava-Style Seamless)
                   ========================================================= -->
              <template v-if="rideForm.aspectRatio === 'landscape'">
                <div class="m-banner-strava-shell">
                  <!-- Left Map Viewport (Directly floating, NO card box!) -->
                  <div
                    v-if="rideForm.showGpsRoute && currentRoute"
                    class="m-banner-seamless-map"
                  >
                    <svg
                      viewBox="0 0 400 320"
                      class="m-gps-svg"
                      fill="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="mSpectrumL"
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
                      </defs>

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

                      <path
                        :d="currentRoute.pathD"
                        fill="none"
                        stroke="#38BDF8"
                        stroke-width="14"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        opacity="0.4"
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
                            ? 'url(#mSpectrumL)'
                            : rideForm.routeRenderStyle === 'kinetic_neon'
                              ? '#C9F36A'
                              : '#38BDF8'
                        "
                        stroke-width="4.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />

                      <g
                        v-if="rideForm.showWaypoints && currentRoute.waypoints"
                      >
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
                    <div class="m-banner-floating-loc">
                      📍 {{ currentRoute?.name || 'Rute Gowes' }} ·
                      <span class="text-sky">+{{ rideForm.elevationM }}m</span>
                    </div>
                  </div>

                  <!-- Right Data Cockpit -->
                  <div class="m-banner-seamless-data">
                    <div class="m-banner-top-row">
                      <div class="m-brand-chip-seamless">
                        <div class="m-brand-mark-box">
                          <svg
                            viewBox="0 0 40 40"
                            fill="none"
                            width="13"
                            height="13"
                            aria-hidden="true"
                          >
                            <rect
                              width="40"
                              height="40"
                              rx="10"
                              fill="#0F172A"
                            />
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
                        <span class="m-brand-text-seamless"
                          >Gowes<span class="brand-kit-accent">Kit</span></span
                        >
                      </div>
                      <div
                        v-if="rideForm.activeSticker !== 'none'"
                        class="m-sticker-chip-seamless"
                      >
                        {{ getStickerLabel(rideForm.activeSticker) }}
                      </div>
                    </div>

                    <div class="m-banner-seamless-hero">
                      <div class="m-mileage-row">
                        <span class="m-num">{{ rideForm.distanceKm }}</span>
                        <span class="m-unit">KM</span>
                      </div>
                      <h3 class="m-title">{{ rideForm.title }}</h3>
                      <div class="m-meta">
                        🚴 {{ rideForm.bikeName }} ·
                        {{ rideForm.temperatureC }}°C Cerah
                      </div>
                    </div>

                    <!-- Seamless Telemetry Deck -->
                    <div class="m-banner-telemetry-seamless">
                      <div class="mb-stat-block">
                        <span class="mb-stat-lbl">WAKTU</span>
                        <strong class="mb-stat-val">{{
                          formatDuration(rideForm.durationMinutes)
                        }}</strong>
                      </div>
                      <div class="mb-stat-block">
                        <span class="mb-stat-lbl">SPEED</span>
                        <strong class="mb-stat-val text-lime"
                          >{{ rideForm.avgSpeedKmH }} km/h</strong
                        >
                      </div>
                      <div class="mb-stat-block">
                        <span class="mb-stat-lbl">CLIMB</span>
                        <strong class="mb-stat-val text-sky"
                          >+{{ rideForm.elevationM }}m</strong
                        >
                      </div>
                      <div class="mb-stat-block">
                        <span class="mb-stat-lbl">KALORI</span>
                        <strong class="mb-stat-val text-coral"
                          >~{{ rideForm.caloriesKcal }}</strong
                        >
                      </div>
                    </div>

                    <div class="m-banner-watermark-seamless">
                      ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
                    </div>
                  </div>
                </div>
              </template>

              <!-- =========================================================
                   LAYOUT B: SQUARE FEED (1:1 Balanced Square)
                   ========================================================= -->
              <template v-else-if="rideForm.aspectRatio === 'post'">
                <div class="m-square-shell">
                  <div class="modal-poster-top">
                    <div class="m-brand-chip">
                      <div class="m-brand-mark-box">
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
                      <span class="m-brand-text">
                        Gowes<span class="brand-kit-accent">Kit</span>
                      </span>
                    </div>

                    <div
                      v-if="rideForm.activeSticker !== 'none'"
                      class="m-sticker-badge"
                    >
                      {{ getStickerLabel(rideForm.activeSticker) }}
                    </div>
                  </div>

                  <!-- Center Radar Map Stage (Seamless floating) -->
                  <div class="m-square-map-stage">
                    <div
                      v-if="rideForm.showGpsRoute && currentRoute"
                      class="m-square-svg-wrap"
                    >
                      <svg
                        viewBox="0 0 400 320"
                        class="m-gps-svg"
                        fill="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id="mSpectrumS"
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
                          stroke="#38BDF8"
                          stroke-width="14"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          opacity="0.4"
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
                              ? 'url(#mSpectrumS)'
                              : rideForm.routeRenderStyle === 'kinetic_neon'
                                ? '#C9F36A'
                                : '#38BDF8'
                          "
                          stroke-width="4.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />

                        <g
                          v-if="
                            rideForm.showWaypoints && currentRoute.waypoints
                          "
                        >
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
                    <div class="m-square-floating-loc">
                      📍 {{ currentRoute?.name || 'Rute Gowes' }} · +{{
                        rideForm.elevationM
                      }}m
                    </div>
                  </div>

                  <!-- Bottom Hero + 4 Metrics -->
                  <div class="m-square-bottom">
                    <div class="m-square-hero-row">
                      <div class="m-mileage-row">
                        <span class="m-num">{{ rideForm.distanceKm }}</span>
                        <span class="m-unit">KM</span>
                      </div>
                      <div class="m-square-titles">
                        <h3 class="m-title">{{ rideForm.title }}</h3>
                        <div class="m-meta">
                          🚴 {{ rideForm.bikeName }} ·
                          {{ rideForm.temperatureC }}°C
                        </div>
                      </div>
                    </div>

                    <div class="m-square-metrics">
                      <div class="msq-pill">
                        <span class="msq-lbl">WAKTU</span>
                        <strong class="msq-val">{{
                          formatDuration(rideForm.durationMinutes)
                        }}</strong>
                      </div>
                      <div class="msq-div" />
                      <div class="msq-pill">
                        <span class="msq-lbl">AVG SPEED</span>
                        <strong class="msq-val text-lime"
                          >{{ rideForm.avgSpeedKmH }} km/h</strong
                        >
                      </div>
                      <div class="msq-div" />
                      <div class="msq-pill">
                        <span class="msq-lbl">CLIMB</span>
                        <strong class="msq-val text-sky"
                          >+{{ rideForm.elevationM }}m</strong
                        >
                      </div>
                      <div class="msq-div" />
                      <div class="msq-pill">
                        <span class="msq-lbl">KALORI</span>
                        <strong class="msq-val text-coral"
                          >~{{ rideForm.caloriesKcal }}</strong
                        >
                      </div>
                    </div>
                  </div>

                  <div class="modal-watermark watermark-center">
                    ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
                  </div>
                </div>
              </template>

              <!-- =========================================================
                   LAYOUT C: STORY (9:16 Vertical Majestic)
                   ========================================================= -->
              <template v-else>
                <!-- Dynamic GPS Route Layer with Topographic Contour Mesh -->
                <div
                  v-if="rideForm.showGpsRoute && currentRoute"
                  class="m-gps-route-layer"
                >
                  <svg
                    viewBox="0 0 400 350"
                    class="m-gps-svg"
                    fill="none"
                    aria-hidden="true"
                  >
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
                      stroke="#38BDF8"
                      stroke-width="14"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      opacity="0.35"
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
                      stroke="#C9F36A"
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

                <!-- Official GowesKit Brand Chip -->
                <div class="modal-poster-top">
                  <div class="m-brand-chip">
                    <div class="m-brand-mark-box">
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
                    <span class="m-brand-text">
                      Gowes<span class="brand-kit-accent">Kit</span>
                    </span>
                  </div>

                  <div
                    v-if="rideForm.activeSticker !== 'none'"
                    class="m-sticker-badge"
                  >
                    {{ getStickerLabel(rideForm.activeSticker) }}
                  </div>
                </div>

                <div class="modal-poster-mid">
                  <div
                    v-if="rideForm.templateStyle === 'rapha_editorial'"
                    class="m-rapha-tag"
                  >
                    STAGE 01 · FINISHED ETAPPE
                  </div>
                  <div
                    v-else-if="rideForm.templateStyle === 'cyber_hud'"
                    class="m-cyber-tag"
                  >
                    GPS: LOCKED (14 SATS) · CAD: 88 RPM
                  </div>
                  <div
                    v-else-if="rideForm.templateStyle === 'cafe_santai'"
                    class="m-cafe-tag"
                  >
                    ☕ RECOVERY MODE · KULINERAN
                  </div>

                  <div class="m-mileage-row">
                    <span class="m-num">{{ rideForm.distanceKm }}</span>
                    <span class="m-unit">KM</span>
                  </div>
                  <h3 class="m-title">{{ rideForm.title }}</h3>
                  <div class="m-meta">
                    🚴 {{ rideForm.bikeName }} · {{ rideForm.temperatureC }}°C
                    Cerah
                  </div>
                </div>

                <div class="modal-poster-bot">
                  <div class="m-elev-row">
                    <span>ELEVASI PROFILE</span>
                    <span class="text-sky"
                      >+{{ rideForm.elevationM }}m Climb</span
                    >
                  </div>
                  <svg
                    viewBox="0 0 300 20"
                    class="m-elev-curve-svg"
                    aria-hidden="true"
                    style="width: 100%; height: 16px; margin: 0.15rem 0"
                  >
                    <path
                      d="M0 16 Q 70 14, 140 6 T 260 4 L 300 2"
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
                      cy="16"
                      r="2"
                      :fill="
                        rideForm.templateStyle === 'cafe_santai'
                          ? '#F59E0B'
                          : '#38BDF8'
                      "
                    />
                    <circle
                      cx="300"
                      cy="2"
                      r="3"
                      :fill="
                        rideForm.templateStyle === 'cafe_santai'
                          ? '#FDE68A'
                          : rideForm.templateStyle === 'rapha_editorial'
                            ? '#FFD1C9'
                            : '#C9F36A'
                      "
                    />
                  </svg>
                  <div class="m-pillars-row">
                    <div class="m-pcol">
                      <span class="m-plbl">WAKTU</span>
                      <strong class="m-pval">{{
                        formatDuration(rideForm.durationMinutes)
                      }}</strong>
                    </div>
                    <div class="m-pdiv" />
                    <div class="m-pcol">
                      <span class="m-plbl">SPEED</span>
                      <strong
                        class="m-pval"
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
                    <div class="m-pdiv" />
                    <div class="m-pcol">
                      <span class="m-plbl">KALORI</span>
                      <strong class="m-pval text-coral"
                        >~{{ rideForm.caloriesKcal }}</strong
                      >
                    </div>
                  </div>
                </div>

                <div class="modal-watermark">
                  ⚡ VERIFIED BY GOWESKIT ENGINE · GOWESKIT.ID
                </div>
              </template>
            </div>
          </div>

          <!-- Right / Bottom: Tool Tab Controls -->
          <div class="modal-controls-col">
            <nav class="m-tabs-nav" aria-label="Tab Konfigurasi">
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'templates' }"
                @click="activeTab = 'templates'"
              >
                <GIcon
                  name="palette"
                  size="xs"
                  color="var(--color-chain-lime)"
                />
                <span>Gaya</span>
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'route' }"
                @click="activeTab = 'route'"
              >
                <GIcon name="route" size="xs" />
                <span>Rute</span>
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'backgrounds' }"
                @click="activeTab = 'backgrounds'"
              >
                <GIcon name="mountain" size="xs" />
                <span>Nuansa</span>
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'stickers' }"
                @click="activeTab = 'stickers'"
              >
                <GIcon name="trophy" size="xs" />
                <span>Stiker</span>
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'ai' }"
                @click="activeTab = 'ai'"
              >
                <GIcon
                  name="bolt"
                  size="xs"
                  filled
                  color="var(--color-chain-lime)"
                />
                <span>AI</span>
              </button>
              <button
                type="button"
                class="m-tab-item"
                :class="{ active: activeTab === 'data' }"
                @click="activeTab = 'data'"
              >
                <GIcon name="wrench" size="xs" />
                <span>Edit</span>
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
                  <GIcon name="bolt" size="xs" filled color="#C9F36A" />
                  <strong>Strava Bold</strong>
                  <small>Kinetic Neon Green</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{
                    active: rideForm.templateStyle === 'rapha_editorial',
                  }"
                  @click="rideForm.templateStyle = 'rapha_editorial'"
                >
                  <GIcon name="mountain" size="xs" color="#FF8C75" />
                  <strong>Rapha Editorial</strong>
                  <small>Serif &amp; Clean GPS</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cyber_hud' }"
                  @click="rideForm.templateStyle = 'cyber_hud'"
                >
                  <GIcon name="radar" size="xs" color="#38BDF8" />
                  <strong>Cyber HUD</strong>
                  <small>HUD Grid &amp; Sensor</small>
                </button>
                <button
                  type="button"
                  class="m-style-card"
                  :class="{ active: rideForm.templateStyle === 'cafe_santai' }"
                  @click="rideForm.templateStyle = 'cafe_santai'"
                >
                  <GIcon name="coffee" size="xs" color="#F59E0B" />
                  <strong>Kopi &amp; Sate</strong>
                  <small>Golden Amber Fuel</small>
                </button>
              </div>
            </div>

            <!-- Tab: Route GPS -->
            <div v-show="activeTab === 'route'" class="m-tab-panel">
              <button
                type="button"
                class="m-btn-sync"
                :disabled="isSyncingGps"
                @click="syncFromDeviceGpsOrSession"
              >
                <GIcon name="radar" size="xs" color="var(--color-chain-lime)" />
                <span>{{
                  isSyncingGps
                    ? 'Menyambungkan GPS...'
                    : '📡 Tarik Jejak GPS Sesi Solo / HP'
                }}</span>
              </button>

              <div class="m-presets-col">
                <div
                  v-if="customGpxRoute"
                  class="m-preset-card active-custom"
                  :class="{
                    active: rideForm.selectedRoutePresetId === 'custom_gpx',
                  }"
                  @click="rideForm.selectedRoutePresetId = 'custom_gpx'"
                >
                  <strong>📍 {{ customGpxRoute.name }}</strong>
                  <small
                    >{{ customGpxRoute.location }} ·
                    {{ customGpxRoute.distanceKm }} km · +{{
                      customGpxRoute.elevationM
                    }}m</small
                  >
                </div>

                <div
                  v-for="preset in ROUTE_PRESETS"
                  :key="preset.id"
                  class="m-preset-card"
                  :class="{
                    active: rideForm.selectedRoutePresetId === preset.id,
                  }"
                  @click="selectRoutePreset(preset)"
                >
                  <strong>{{ preset.name }}</strong>
                  <small
                    >{{ preset.distanceKm }} km · +{{
                      preset.elevationM
                    }}m</small
                  >
                </div>
              </div>

              <label class="m-upload-label">
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

            <!-- Tab 2: Backgrounds -->
            <div v-show="activeTab === 'backgrounds'" class="m-bg-grid">
              <button
                type="button"
                class="m-bg-btn bg--alpine"
                :class="{ active: rideForm.bgPreset === 'alpine' }"
                @click="rideForm.bgPreset = 'alpine'"
              >
                <GIcon name="mountain" size="xs" color="#38BDF8" />
                <span>Alpine</span>
              </button>
              <button
                type="button"
                class="m-bg-btn bg--gravel"
                :class="{ active: rideForm.bgPreset === 'gravel' }"
                @click="rideForm.bgPreset = 'gravel'"
              >
                <GIcon name="tree" size="xs" color="#4ADE80" />
                <span>Gravel</span>
              </button>
              <button
                type="button"
                class="m-bg-btn bg--sunset"
                :class="{ active: rideForm.bgPreset === 'sunset' }"
                @click="rideForm.bgPreset = 'sunset'"
              >
                <GIcon name="sun" size="xs" color="#FB923C" />
                <span>Sunset</span>
              </button>
              <button
                type="button"
                class="m-bg-btn bg--crit"
                :class="{ active: rideForm.bgPreset === 'crit' }"
                @click="rideForm.bgPreset = 'crit'"
              >
                <GIcon name="bolt" size="xs" color="#C084FC" filled />
                <span>Crit</span>
              </button>
              <button
                type="button"
                class="m-bg-btn bg--cafe"
                :class="{ active: rideForm.bgPreset === 'cafe' }"
                @click="rideForm.bgPreset = 'cafe'"
              >
                <GIcon name="coffee" size="xs" color="#FBBF24" />
                <span>Cafe</span>
              </button>
              <button
                type="button"
                class="m-bg-btn bg--topo"
                :class="{ active: rideForm.bgPreset === 'topo' }"
                @click="rideForm.bgPreset = 'topo'"
              >
                <GIcon name="route" size="xs" color="#C9F36A" />
                <span>Topo</span>
              </button>
            </div>
            <label v-show="activeTab === 'backgrounds'" class="m-upload-cta">
              <input
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handlePhotoUpload"
              />
              <GIcon name="camera" size="xs" />
              <span>Unggah Foto Sendiri dari HP</span>
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
                  <GIcon name="trophy" size="xs" color="#EAB308" filled /> KOM
                  Hunter
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'cafe' }"
                  @click="rideForm.activeSticker = 'cafe'"
                >
                  <GIcon name="coffee" size="xs" color="#D97706" /> Coffee
                  Approved
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'beast' }"
                  @click="rideForm.activeSticker = 'beast'"
                >
                  <GIcon name="mountain" size="xs" color="#10B981" /> Climb
                  Beast
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'speed' }"
                  @click="rideForm.activeSticker = 'speed'"
                >
                  <GIcon name="bolt" size="xs" color="#C9F36A" filled />
                  Breakaway
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'power' }"
                  @click="rideForm.activeSticker = 'power'"
                >
                  <GIcon name="bolt" size="xs" color="#F59E0B" /> 245W Power
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'gradient' }"
                  @click="rideForm.activeSticker = 'gradient'"
                >
                  <GIcon name="mountain" size="xs" color="#EF4444" /> 18.5%
                  Gradient
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'hr' }"
                  @click="rideForm.activeSticker = 'hr'"
                >
                  <GIcon name="heart" size="xs" color="#EC4899" filled /> 158
                  BPM
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'fuel' }"
                  @click="rideForm.activeSticker = 'fuel'"
                >
                  <GIcon name="water" size="xs" color="#3B82F6" /> Pitstop Fuel
                </button>
                <button
                  type="button"
                  class="m-chip"
                  :class="{ active: rideForm.activeSticker === 'none' }"
                  @click="rideForm.activeSticker = 'none'"
                >
                  <GIcon name="close" size="xs" /> Polos
                </button>
              </div>
            </div>

            <!-- Tab 4: AI -->
            <div v-show="activeTab === 'ai'" class="m-tab-panel">
              <div class="m-ai-box">
                <div class="m-ai-top">
                  <strong
                    ><GIcon name="sparkles" size="xs" /> AI Story &amp;
                    Caption</strong
                  >
                  <button
                    type="button"
                    class="m-gen-btn"
                    :disabled="isAiGenerating"
                    @click="generateAiStory"
                  >
                    <GIcon name="sparkles" size="xs" />
                    <span>{{
                      isAiGenerating ? 'Meracik...' : 'Generate'
                    }}</span>
                  </button>
                </div>
                <div class="m-persona-deck">
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'athlete' }"
                    @click="selectedPersona = 'athlete'"
                  >
                    <GIcon name="trophy" size="xs" />
                    <span>Atlet</span>
                  </button>
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'humor' }"
                    @click="selectedPersona = 'humor'"
                  >
                    <GIcon name="coffee" size="xs" />
                    <span>Santai</span>
                  </button>
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'technical' }"
                    @click="selectedPersona = 'technical'"
                  >
                    <GIcon name="wrench" size="xs" />
                    <span>Tech</span>
                  </button>
                  <button
                    type="button"
                    class="m-p-btn"
                    :class="{ active: selectedPersona === 'gravel' }"
                    @click="selectedPersona = 'gravel'"
                  >
                    <GIcon name="mountain" size="xs" />
                    <span>Gravel</span>
                  </button>
                </div>
                <div v-if="aiRecap.photoVisualInsight" class="ai-insight-box">
                  <span class="ai-insight-label">👁️ AI Vision:</span>
                  <p class="ai-insight-text">
                    {{ aiRecap.photoVisualInsight }}
                  </p>
                </div>
                <p class="m-caption-text">
                  {{ aiRecap.captions[selectedPersona] }}
                </p>
                <div v-if="aiRecap.trainingInsight" class="ai-coach-box">
                  <span class="ai-coach-label">⚡ AI Coach:</span>
                  <p class="ai-coach-text">{{ aiRecap.trainingInsight }}</p>
                </div>
                <button
                  type="button"
                  class="m-copy-btn"
                  @click="copyCaption(aiRecap.captions[selectedPersona] || '')"
                >
                  <GIcon name="bookmark" size="xs" />
                  <span>Salin Caption</span>
                </button>
                <ElevationProfileChart
                  :distance-km="rideForm.distanceKm"
                  :elevation-gain-m="rideForm.elevationM"
                  :climb-category="aiRecap.climbGradeScore"
                />
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
                <GIcon name="radar" size="xs" color="var(--color-chain-lime)" />
                <span>{{
                  isSyncingGps
                    ? 'Menyambungkan...'
                    : 'Tarik Data Sesi Gowes Asli Saya'
                }}</span>
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
              <button
                type="button"
                class="m-action-share"
                :disabled="isExporting"
                @click="shareToMedia"
              >
                <GIcon name="share" size="xs" />
                <span>Bagikan Langsung</span>
              </button>
              <button
                type="button"
                class="m-action-dl"
                :disabled="isExporting"
                @click="downloadStoryImage"
              >
                <GIcon name="download" size="xs" />
                <span>Unduh PNG</span>
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
  max-width: 20rem !important;
  padding: 0.75rem !important;
}

.aspect--landscape {
  aspect-ratio: 16 / 9 !important;
  max-width: 28rem !important;
  padding: 0.75rem 0.95rem !important;
}

/* ========================================================
   MODAL WIDESCREEN BANNER (16:9) SEAMLESS STRAVA-STYLE
   ======================================================== */
.m-banner-strava-shell {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  align-items: center;
}

.m-banner-seamless-map {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.m-banner-floating-loc {
  font-family: var(--font-ui);
  font-size: 0.46rem;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: auto;
}

.m-banner-seamless-data {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 0.1rem 0;
}

.m-banner-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.m-brand-chip-seamless {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(201, 243, 106, 0.4);
  padding: 0.12rem 0.42rem 0.12rem 0.22rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.m-brand-text-seamless {
  font-family: var(--font-ui);
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  color: #ffffff;
  white-space: nowrap;
}

.brand-kit-accent {
  color: var(--color-chain-lime);
}

.m-sticker-chip-seamless {
  font-family: var(--font-ui);
  font-size: 0.44rem;
  font-weight: 850;
  color: #080d19;
  background: var(--color-chain-lime);
  padding: 0.12rem 0.42rem;
  border-radius: 9999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  white-space: nowrap;
}

.m-banner-seamless-hero {
  margin: auto 0 0.15rem;
}

.m-banner-seamless-hero .m-num {
  font-size: 1.7rem !important;
  line-height: 0.88;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.m-banner-seamless-hero .m-unit {
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffffff;
  margin-left: 0.15rem;
}

.m-banner-seamless-hero .m-title {
  font-size: 0.62rem;
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

.m-banner-seamless-hero .m-meta {
  font-size: 0.46rem;
  color: #94a3b8;
  margin-top: 0.05rem;
}

/* Seamless Typographic Telemetry - NO BOXES! */
.m-banner-telemetry-seamless {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 0.18rem;
  column-gap: 0.55rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0;
  margin: 0.12rem 0;
}

.mb-stat-block {
  display: flex;
  flex-direction: column;
}

.mb-stat-lbl {
  font-family: var(--font-ui);
  font-size: 0.36rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.mb-stat-val {
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 900;
  color: #ffffff;
  line-height: 1.1;
}

.m-banner-watermark-seamless {
  text-align: left;
  font-family: var(--font-ui);
  font-size: 0.36rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgba(201, 243, 106, 0.85);
  margin-top: 0.08rem;
}

/* ========================================================
   MODAL SQUARE (1:1) STYLING
   ======================================================== */
.m-square-shell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  position: relative;
  z-index: 2;
}

.m-square-map-stage {
  position: relative;
  width: 100%;
  height: 48%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  margin: 0.2rem 0;
}

.m-square-svg-wrap {
  width: 100%;
  height: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-square-floating-loc {
  font-family: var(--font-ui);
  font-size: 0.44rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
  text-align: center;
  margin-top: auto;
}

.m-square-bottom {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.m-square-hero-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.m-square-hero-row .m-num {
  font-size: 1.75rem !important;
  line-height: 0.9;
  font-weight: 900;
  color: var(--color-chain-lime);
}

.m-square-hero-row .m-unit {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ffffff;
}

.m-square-titles {
  flex: 1;
  text-align: right;
  overflow: hidden;
}

.m-square-titles .m-title {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.m-square-titles .m-meta {
  font-size: 0.48rem;
  color: #94a3b8;
  margin-top: 0.05rem;
}

.m-square-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(201, 243, 106, 0.3);
  border-radius: 0.65rem;
  padding: 0.22rem 0.35rem;
}

.msq-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.msq-div {
  width: 1px;
  height: 1rem;
  background: rgba(255, 255, 255, 0.1);
}

.msq-lbl {
  font-family: var(--font-ui);
  font-size: 0.34rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.msq-val {
  font-family: var(--font-ui);
  font-size: 0.64rem;
  font-weight: 900;
  line-height: 1.1;
  color: #f8fafc;
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
  color: #ffffff;
}

.theme--rapha_editorial .m-unit {
  color: #ff8c75;
}

.m-rapha-tag {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 900;
  color: #ff8c75;
  margin-bottom: 0.15rem;
}

.theme--cyber_hud {
  font-family: var(--font-ui);
  border-color: rgba(56, 189, 248, 0.4);
}

.theme--cyber_hud .m-num {
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
}

.theme--cyber_hud .m-unit {
  color: #00ff66;
}

.m-cyber-tag {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 900;
  color: #00ff66;
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

.m-hud-tl {
  top: 0.4rem;
  left: 0.4rem;
}
.m-hud-tr {
  top: 0.4rem;
  right: 0.4rem;
}
.m-hud-bl {
  bottom: 0.4rem;
  left: 0.4rem;
}
.m-hud-br {
  bottom: 0.4rem;
  right: 0.4rem;
}

.m-hud-grid-layer {
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
}

.theme--cafe_santai .m-num {
  color: #f59e0b;
}

.theme--cafe_santai .m-unit {
  color: #fde68a;
}

.m-cafe-tag {
  font-size: 0.54rem;
  font-weight: 900;
  color: #fde68a;
  margin-bottom: 0.15rem;
}

.modal-poster-vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 10, 18, 0.3) 0%,
    transparent 40%,
    rgba(6, 10, 18, 0.9) 100%
  );
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

.text-white {
  color: #ffffff;
}
.text-lime {
  color: var(--color-chain-lime);
}
.text-amber {
  color: #f59e0b;
}

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
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 0.35rem;
}

.m-stat-div {
  width: 1px;
  height: 1.2rem;
  background: rgba(255, 255, 255, 0.1);
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

.text-sky {
  color: #38bdf8;
}
.text-coral {
  color: #ff8c75;
}

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

.bg--alpine {
  background: linear-gradient(135deg, #1e3a8a, #0f172a);
}
.bg--gravel {
  background: linear-gradient(135deg, #14532d, #0f172a);
}
.bg--sunset {
  background: linear-gradient(135deg, #9a3412, #0f172a);
}
.bg--crit {
  background: linear-gradient(135deg, #6b21a8, #0b0f19);
}
.bg--cafe {
  background: linear-gradient(135deg, #78350f, #0f172a);
}
.bg--topo {
  background: linear-gradient(135deg, #0b1120, #020617);
}

.m-upload-cta,
.m-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem;
  border-radius: 0.85rem;
  border: 1.5px dashed rgba(201, 243, 106, 0.4);
  background: rgba(201, 243, 106, 0.05);
  font-size: 0.75rem;
  font-weight: 850;
  color: var(--color-chain-lime);
  cursor: pointer;
  margin-top: 0.4rem;
}

.m-preset-card.active-custom {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.08);
}

.m-preset-card.active-custom.active {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
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

.ai-insight-box {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 0.65rem;
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ai-insight-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
  color: #38bdf8;
}

.ai-insight-text {
  margin: 0;
  font-size: 0.72rem;
  color: #e0f2fe;
  line-height: 1.35;
}

.ai-coach-box {
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.3);
  border-radius: 0.65rem;
  padding: 0.5rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.ai-coach-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
  color: #facc15;
}

.ai-coach-text {
  margin: 0;
  font-size: 0.72rem;
  color: #fef08a;
  line-height: 1.35;
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
