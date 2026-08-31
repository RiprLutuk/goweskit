<script setup lang="ts">
import {
  PLACE_TYPES,
  ROUTE_DIFFICULTIES,
  ROUTE_TYPES,
  type Coordinate,
  type NearbyExploreResponse,
  type NearbyPlace,
  type NearbyRoute,
  type RouteElevationResponse,
  type SaveItemResponse,
} from '@goweskit/contracts';

type ExploreItem = NearbyPlace | NearbyRoute;

// Default to the main cycling hub where seeded routes & places are available
const DEFAULT_EXPLORE_CENTER: Coordinate = {
  longitude: 106.6315,
  latitude: -6.1775,
};

const api = useApi();
const { toast } = useNotify();
const center = ref<Coordinate>(DEFAULT_EXPLORE_CENTER);
const userLocation = ref<Coordinate | null>(null);
const radiusKm = ref(15);
const category = ref('all');
const bikeType = ref('all');
const difficulty = ref('all');
const surface = ref('all');
const verificationStatus = ref('all');
const freshness = ref('all');
const beginnerOnly = ref(false);
const searchQuery = ref('');
const showFilterModal = ref(false);
const showContributionsModal = ref(false);
const isDesktopSidebarOpen = ref(true);

const places = ref<NearbyPlace[]>([]);
const routes = ref<NearbyRoute[]>([]);
const selectedId = ref<string | null>(null);
const hoveredElevationDistance = ref<number | null>(null);
const loading = ref(true);
const locating = ref(false);
const errorMessage = ref('');
const locationMessage = ref('');
const mapError = ref(false);

// ── Interactive Bottom Sheet Gesture State (Mobile) ─────────
type SheetPosition = 'collapsed' | 'half' | 'expanded';
const sheetPosition = ref<SheetPosition>('half');
const isDraggingSheet = ref(false);
const sheetCustomHeight = ref<number | null>(null);

let dragStartY = 0;
let dragStartHeight = 0;

function getSheetDefaultHeightPx(pos: SheetPosition): number {
  if (typeof window === 'undefined') return 300;
  const vh = window.innerHeight;
  const bottomBarOffset = 70;
  switch (pos) {
    case 'collapsed':
      return 68;
    case 'half':
      return Math.round(vh * 0.48 - bottomBarOffset);
    case 'expanded':
      return Math.round(vh * 0.86 - bottomBarOffset);
  }
}

function onTouchStartDrag(e: TouchEvent | MouseEvent): void {
  isDraggingSheet.value = true;
  dragStartY =
    'touches' in e && e.touches[0]
      ? e.touches[0].clientY
      : (e as MouseEvent).clientY;
  const currentHeight =
    sheetCustomHeight.value ?? getSheetDefaultHeightPx(sheetPosition.value);
  dragStartHeight = currentHeight;
}

function onTouchMoveDrag(e: TouchEvent | MouseEvent): void {
  if (!isDraggingSheet.value) return;
  const clientY =
    'touches' in e && e.touches[0]
      ? e.touches[0].clientY
      : (e as MouseEvent).clientY;
  const delta = dragStartY - clientY;
  const vh = window.innerHeight;
  const newHeight = Math.max(
    65,
    Math.min(vh * 0.86 - 70, dragStartHeight + delta),
  );
  sheetCustomHeight.value = newHeight;
}

function onTouchEndDrag(): void {
  if (!isDraggingSheet.value) return;
  isDraggingSheet.value = false;
  const finalHeight =
    sheetCustomHeight.value ?? getSheetDefaultHeightPx(sheetPosition.value);
  const vh = window.innerHeight;

  const collapsedPx = 68;
  const halfPx = Math.round(vh * 0.48 - 70);
  const expandedPx = Math.round(vh * 0.86 - 70);

  const distToCollapsed = Math.abs(finalHeight - collapsedPx);
  const distToHalf = Math.abs(finalHeight - halfPx);
  const distToExpanded = Math.abs(finalHeight - expandedPx);

  if (distToCollapsed <= distToHalf && distToCollapsed <= distToExpanded) {
    sheetPosition.value = 'collapsed';
  } else if (distToHalf <= distToExpanded) {
    sheetPosition.value = 'half';
  } else {
    sheetPosition.value = 'expanded';
  }
  sheetCustomHeight.value = null;
}

function toggleSheetPosition(): void {
  if (sheetPosition.value === 'collapsed') {
    sheetPosition.value = 'half';
  } else if (sheetPosition.value === 'half') {
    sheetPosition.value = 'expanded';
  } else {
    sheetPosition.value = 'collapsed';
  }
  sheetCustomHeight.value = null;
}

function cleanName(rawName: string): string {
  return rawName.replace(/^\[(Place|Route)\]\s*/i, '').replace(/^Demo\s+/i, '').trim();
}

function cleanDescription(rawDesc: string | null | undefined): string {
  if (!rawDesc) return '';
  return rawDesc.replace(/\s*\(Seed id:\s*[0-9a-f-]+\)\.?/i, '').trim();
}

function getItemIconName(item: ExploreItem): string {
  if (item.kind === 'route') return 'route';
  switch (item.type) {
    case 'workshop':
      return 'wrench';
    case 'store':
      return 'shop';
    case 'coffee':
      return 'coffee';
    case 'water':
      return 'water';
    case 'trailhead':
      return 'tree';
    case 'bike_park':
      return 'mountain';
    case 'meeting_point':
      return 'flag';
    default:
      return 'pin';
  }
}

const allItems = computed<ExploreItem[]>(() => {
  const list = [...places.value, ...routes.value];
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (item) =>
      cleanName(item.name).toLowerCase().includes(q) ||
      cleanDescription(item.description).toLowerCase().includes(q),
  );
});

const selectedItem = computed<ExploreItem | null>(
  () => allItems.value.find(({ id }) => id === selectedId.value) ?? null,
);

function optionalFilter(value: string): string | undefined {
  return value === 'all' ? undefined : value;
}

async function loadNearby(): Promise<void> {
  loading.value = true;
  errorMessage.value = '';
  try {
    const selectedPlaceType = PLACE_TYPES.find(
      (value) => value === category.value,
    );
    const selectedRouteType = ROUTE_TYPES.find(
      (value) => value === category.value,
    );
    const response = await api<NearbyExploreResponse>('/explore/nearby', {
      method: 'POST',
      body: {
        center: center.value,
        radiusKm: radiusKm.value,
        placeTypes:
          selectedPlaceType === undefined ? undefined : [selectedPlaceType],
        routeTypes:
          selectedRouteType === undefined ? undefined : [selectedRouteType],
        bikeType: optionalFilter(bikeType.value),
        difficulty: optionalFilter(difficulty.value),
        surface: optionalFilter(surface.value),
        verificationStatus: optionalFilter(verificationStatus.value),
        freshness: optionalFilter(freshness.value),
        beginnerFriendly: beginnerOnly.value ? true : undefined,
      },
    });
    places.value =
      category.value === 'routes' || selectedRouteType !== undefined
        ? []
        : response.places;
    routes.value =
      category.value === 'places' || selectedPlaceType !== undefined
        ? []
        : response.routes;
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function useMyLocation(): void {
  locationMessage.value = '';
  if (!('geolocation' in navigator)) {
    locationMessage.value = 'Browser tidak mendukung GPS.';
    return;
  }

  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coordinate = {
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      };
      userLocation.value = coordinate;
      center.value = coordinate;
      locating.value = false;
      toast.success('Lokasi Terdeteksi', 'Memuat rute & spot gowes terdekat.');
      void loadNearby();
    },
    () => {
      locating.value = false;
      locationMessage.value = 'GPS tidak tersedia. Menggunakan Area Default.';
      toast.info('GPS Tidak Tersedia', 'Menampilkan rute & tempat gowes area Tangerang/BSD.');
      void loadNearby();
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
  );
}

const { user } = useAuth();
const {
  saveRouteOffline,
  isRouteSavedOffline,
  removeOfflineRoute,
} = useOfflineNavigator();
const showOfflineModal = ref(false);

const elevationData = ref<RouteElevationResponse | null>(null);
const loadingElevation = ref(false);
const savedItems = ref<Set<string>>(new Set());
const savingItem = ref(false);
const saveToast = ref('');

function toggleOfflineRoute(item: ExploreItem): void {
  if (item.kind !== 'route') return;
  if (isRouteSavedOffline(item.id)) {
    removeOfflineRoute(item.id);
    toast.info('Rute Dihapus dari Offline', item.name);
  } else {
    saveRouteOffline({
      id: item.id,
      title: cleanName(item.name),
      description: cleanDescription(item.description),
      distanceKm: item.distanceMeters / 1000,
      elevationGainMeters: item.elevationGainMeters,
      difficulty: item.difficulty,
      coordinates: item.geometry.coordinates as [number, number][],
      elevationProfile: elevationData.value?.elevationProfile ?? undefined,
    });
    toast.success('Rute Tersimpan Offline ✓', 'Siap digunakan di area tanpa sinyal.');
  }
}

async function selectItem(selection: { kind: 'place' | 'route'; id: string }): Promise<void> {
  selectedId.value = selection.id;
  sheetPosition.value = 'half';
  elevationData.value = null;
  hoveredElevationDistance.value = null;

  if (selection.kind === 'route') {
    loadingElevation.value = true;
    try {
      elevationData.value = await api<RouteElevationResponse>(
        `/explore/routes/${selection.id}/elevation`,
      );
    } catch {
      elevationData.value = null;
    } finally {
      loadingElevation.value = false;
    }
  }
}

async function saveSelectedItem(item: ExploreItem): Promise<void> {
  if (!user.value) {
    await navigateTo(`/login?redirect=/explore`);
    return;
  }
  savingItem.value = true;
  saveToast.value = '';
  try {
    await api<SaveItemResponse>('/user/saved-items', {
      method: 'POST',
      body: {
        itemKind: item.kind,
        itemId: item.id,
      },
    });
    savedItems.value.add(item.id);
    saveToast.value = '✓ Disimpan ke Profil!';
    toast.success('Tersimpan', `${cleanName(item.name)} ditambahkan ke favorit.`);
    setTimeout(() => {
      saveToast.value = '';
    }, 2500);
  } catch (error: unknown) {
    saveToast.value = getApiErrorMessage(error);
  } finally {
    savingItem.value = false;
  }
}

const elevationSvgPath = computed(() => {
  if (!elevationData.value || elevationData.value.elevationProfile.length < 2) return '';
  const pts = elevationData.value.elevationProfile;
  const lastPt = pts[pts.length - 1];
  const maxDist = (lastPt ? lastPt.distanceMeters : 1) || 1;
  const minElev = Math.min(...pts.map((p) => p.elevationMeters));
  const maxElev = Math.max(...pts.map((p) => p.elevationMeters));
  const elevRange = maxElev - minElev || 1;

  const w = 300;
  const h = 50;
  const padding = 6;

  const coords = pts.map((p) => {
    const x = Math.round((p.distanceMeters / maxDist) * w);
    const y = Math.round(
      h - padding - ((p.elevationMeters - minElev) / elevRange) * (h - padding * 2),
    );
    return `${x},${y}`;
  });

  return `M ${coords.join(' L ')}`;
});

const elevationFillPath = computed(() => {
  if (!elevationSvgPath.value) return '';
  return `${elevationSvgPath.value} L 300 50 L 0 50 Z`;
});

function onElevationChartMouseMove(e: MouseEvent): void {
  if (!selectedItem.value || selectedItem.value.kind !== 'route') return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  hoveredElevationDistance.value = relX * selectedItem.value.distanceMeters;
}

function onElevationChartMouseLeave(): void {
  hoveredElevationDistance.value = null;
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${String(Math.round(meters))} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function typeLabel(item: ExploreItem): string {
  return (item.kind === 'place' ? item.type : item.routeType).replaceAll(
    '_',
    ' ',
  );
}

function itemDistance(item: ExploreItem): number {
  return item.kind === 'place'
    ? item.distanceMeters
    : item.distanceFromUserMeters;
}

function estimatedRideTime(meters: number): string {
  // Estimated at 20 km/h average cycling speed
  const minutes = Math.round((meters / 1000 / 20) * 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `${hours} jam ${remainingMin}m`;
}

function estimatedCalories(meters: number, elevationMeters = 0): string {
  // Estimated cycling calorie burn (~30 kcal per km + 10 kcal per 100m climb)
  const kcal = Math.round((meters / 1000) * 32 + (elevationMeters / 100) * 12);
  return `${kcal} kkal`;
}

function applyCategory(cat: string): void {
  category.value = cat;
  void loadNearby();
}

async function shareSelectedItem(item: ExploreItem): Promise<void> {
  const name = cleanName(item.name);
  const desc = cleanDescription(item.description);
  const isRoute = item.kind === 'route';
  const url = `${window.location.origin}/explore?selected=${item.id}`;

  let statsText = '';
  if (isRoute) {
    statsText = `📏 Jarak: ${(item.distanceMeters / 1000).toFixed(1)} km · Elevasi: +${item.elevationGainMeters}m
🎯 Kesulitan: ${item.difficulty.toUpperCase()} · Permukaan: ${item.surface}`;
  } else {
    statsText = `📍 Tipe Spot: ${typeLabel(item).toUpperCase()}`;
  }

  const text = `🗺️ REKOMENDASI SPOT & RUTE GOWES · GOWESKIT
━━━━━━━━━━━━━━━━━━━━
🚴 Nama: ${name}
${statsText}
📝 Info: ${desc || 'Spot dan rute gowes terverifikasi komunitas.'}

🔗 Buka peta live & rute GPX di GowesKit:
${url}

#GowesKit #RuteGowes #ExploreGowes #CyclingIndonesia`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Rute/Spot: ${name}`,
        text,
        url,
      });
      toast.success('Rute Dibagikan!', 'Siap diposting atau dikirim ke teman gowes.');
      return;
    } catch {
      // ignore abort
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success('Rute Disalin!', 'Siap ditempel ke WhatsApp atau media sosial.');
  } catch {
    toast.info('Gagal menyalin otomatis', 'Silakan salin manual.');
  }
}

function openExternalNavigation(
  item: ExploreItem,
  platform: 'google' | 'komoot' = 'google',
): void {
  let lat = 0;
  let lng = 0;
  if (item.kind === 'place') {
    lat = item.coordinate.latitude;
    lng = item.coordinate.longitude;
  } else {
    const coords = item.geometry.coordinates[0];
    if (coords) {
      lng = coords[0]!;
      lat = coords[1]!;
    }
  }
  const url =
    platform === 'komoot'
      ? `https://www.komoot.com/plan/@${lat},${lng},14z`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=bicycling`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function getSuitableBikes(item: ExploreItem): string[] {
  if (item.kind === 'route') {
    if (item.routeType === 'mtb') return ['MTB', 'Gravel'];
    if (item.routeType === 'gravel') return ['Gravel', 'MTB', 'All-Road'];
    if (item.routeType === 'road') return ['Road Bike', 'Gravel', 'Folding'];
    return ['Semua Sepeda'];
  }
  if (item.type === 'bike_park') return ['MTB', 'Dirt Jump', 'BMX'];
  if (item.type === 'trailhead') return ['MTB', 'Gravel'];
  if (item.type === 'coffee' || item.type === 'rest') return ['Semua Sepeda', 'Road', 'Gravel', 'Folding'];
  if (item.type === 'workshop' || item.type === 'store') return ['Semua Sepeda'];
  return ['Semua Sepeda'];
}

function getPlaceAmenities(item: ExploreItem): { icon: string; label: string }[] {
  if (item.kind === 'place') {
    switch (item.type) {
      case 'workshop':
        return [
          { icon: '🔧', label: 'Pompa & Perkakas' },
          { icon: '⚙️', label: 'Sparepart Ready' },
          { icon: '🅿️', label: 'Parkir Sepeda' },
        ];
      case 'store':
        return [
          { icon: '🏪', label: 'Aksesoris Gowes' },
          { icon: '🚲', label: 'Unit Sepeda' },
          { icon: '💳', label: 'QRIS & Tunai' },
        ];
      case 'coffee':
        return [
          { icon: '☕', label: 'Kopi & Camilan' },
          { icon: '🪑', label: 'Tempat Duduk' },
          { icon: '🔌', label: 'Stopkontak' },
        ];
      case 'water':
        return [
          { icon: '💧', label: 'Refill Air Bersih' },
          { icon: '🚰', label: 'Keran Siap Pakai' },
        ];
      case 'trailhead':
        return [
          { icon: '🌲', label: 'Jalur Alami' },
          { icon: '🧭', label: 'Papan Petunjuk' },
          { icon: '🅿️', label: 'Parkir Kendaraan' },
        ];
      case 'bike_park':
        return [
          { icon: '🚵', label: 'Rintangan/Drop' },
          { icon: '🚧', label: 'Pump Track' },
          { icon: '🌱', label: 'Latihan Skill' },
        ];
      case 'meeting_point':
        return [
          { icon: '🚩', label: 'Titik Kumpul' },
          { icon: '🅿️', label: 'Halaman Luas' },
          { icon: '💡', label: 'Penerangan' },
        ];
      default:
        return [
          { icon: '🪑', label: 'Tempat Duduk' },
          { icon: '🌳', label: 'Area Teduh' },
        ];
    }
  }
  return [
    { icon: '🛣️', label: item.surface || 'Campuran' },
    { icon: '⚡', label: `Tingkat ${item.difficulty}` },
  ];
}

onMounted(() => {
  void loadNearby();
  window.addEventListener('mousemove', onTouchMoveDrag);
  window.addEventListener('mouseup', onTouchEndDrag);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onTouchMoveDrag);
  window.removeEventListener('mouseup', onTouchEndDrag);
});
</script>

<template>
  <div class="native-map-view">
    <!-- 1. FULL-BLEED MAP CANVAS (100% OF SCREEN) -->
    <div class="map-canvas-container">
      <ClientOnly>
        <ExploreMap
          :center="center"
          :places="places"
          :routes="routes"
          :selected-id="selectedId"
          :user-location="userLocation"
          :hovered-elevation-distance="hoveredElevationDistance"
          @select="selectItem"
          @map-error="mapError = true"
        />
        <template #fallback>
          <div class="map-loading-placeholder">Memuat peta interaktif…</div>
        </template>
      </ClientOnly>
    </div>

    <!-- 2. DESKTOP FLOATING LEFT SIDEBAR (Apple/Google Maps Style) -->
    <aside
      class="desktop-explore-panel"
      :class="{ 'desktop-explore-panel--collapsed': !isDesktopSidebarOpen }"
    >
      <!-- Panel Header & Search Input -->
      <div class="panel-header">
        <div class="panel-brand-row">
          <BrandLogo size="sm" tagline="Explore Radar" />
          <button
            class="sidebar-toggle-btn"
            type="button"
            :title="isDesktopSidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'"
            @click="isDesktopSidebarOpen = !isDesktopSidebarOpen"
          >
            <GIcon :name="isDesktopSidebarOpen ? 'chevron-left' : 'chevron-right'" size="xs" />
          </button>
        </div>

        <div class="panel-search-box">
          <span class="search-icon" aria-hidden="true">
            <GIcon name="search" size="xs" />
          </span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari rute, tanjakan, bengkel…"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="search-clear-btn"
            type="button"
            @click="searchQuery = ''"
          >
            <GIcon name="close" size="xs" />
          </button>
          <button
            class="overlay-icon-btn"
            :class="{ 'overlay-icon-btn--active': userLocation !== null }"
            type="button"
            :title="locating ? 'Mencari lokasi…' : 'Lokasi Saya'"
            :disabled="locating"
            @click="useMyLocation"
          >
            <GIcon name="radar" size="xs" :color="userLocation !== null ? '#16A34A' : 'currentColor'" />
          </button>
          <button
            class="overlay-icon-btn"
            type="button"
            title="Filter & Radius"
            @click="showFilterModal = !showFilterModal"
          >
            <GIcon name="filter" size="xs" />
          </button>
          <button
            class="overlay-icon-btn overlay-icon-btn--primary"
            type="button"
            title="Upload GPX atau Lapor Bahaya"
            @click="showContributionsModal = true"
          >
            <GIcon name="plus" size="xs" color="#17202A" />
          </button>
        </div>

        <!-- Category Horizontal Pills -->
        <div class="category-scroll-strip">
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'all' }"
            type="button"
            @click="applyCategory('all')"
          >
            Semua ({{ allItems.length }})
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'routes' }"
            type="button"
            @click="applyCategory('routes')"
          >
            <GIcon name="route" size="xs" /> Rute ({{ routes.length }})
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'workshop' }"
            type="button"
            @click="applyCategory('workshop')"
          >
            <GIcon name="wrench" size="xs" /> Bengkel
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'store' }"
            type="button"
            @click="applyCategory('store')"
          >
            <GIcon name="shop" size="xs" /> Toko
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'coffee' }"
            type="button"
            @click="applyCategory('coffee')"
          >
            <GIcon name="coffee" size="xs" /> Kopi
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'water' }"
            type="button"
            @click="applyCategory('water')"
          >
            <GIcon name="water" size="xs" /> Air
          </button>
          <button
            class="cat-chip"
            :class="{ 'cat-chip--active': category === 'trailhead' }"
            type="button"
            @click="applyCategory('trailhead')"
          >
            <GIcon name="tree" size="xs" /> Trail
          </button>
        </div>
      </div>

      <!-- Panel Body: Selected Spot or List of Spots -->
      <div class="panel-body">
        <!-- A. Selected Spot Detail View -->
        <article v-if="selectedItem" class="desktop-selected-card">
          <!-- Top Tag Stack & Dismiss Button -->
          <div class="card-headline-row">
            <div class="pill-badge-stack">
              <span class="type-pill" :class="`type-pill--${selectedItem.kind === 'place' ? selectedItem.type : selectedItem.routeType}`">
                {{ typeLabel(selectedItem) }}
              </span>
              <span class="dist-pill">📍 {{ formatDistance(itemDistance(selectedItem)) }}</span>
              <span v-if="selectedItem.verificationStatus === 'staff_verified'" class="verified-pill">
                ✓ Terverifikasi
              </span>
              <span v-if="selectedItem.beginnerFriendly" class="beginner-pill">
                🌱 Ramah Pemula
              </span>
            </div>
            <button class="dismiss-circle-btn" type="button" title="Tutup" @click="selectedId = null">✕</button>
          </div>

          <div class="card-title-group">
            <h2 class="card-item-title">{{ cleanName(selectedItem.name) }}</h2>
            <p class="card-item-desc">{{ cleanDescription(selectedItem.description) || 'Spot gowes rekomendasi komunitas.' }}</p>
          </div>

          <!-- Quick Telemetry Stats Grid for Routes -->
          <div v-if="selectedItem.kind === 'route'" class="route-metrics-grid">
            <div class="metric-pill">
              <span class="metric-label">Jarak</span>
              <span class="metric-val">{{ (selectedItem.distanceMeters / 1000).toFixed(1) }} <small>km</small></span>
            </div>
            <div class="metric-pill">
              <span class="metric-label">Elevasi</span>
              <span class="metric-val">+{{ selectedItem.elevationGainMeters }} <small>m</small></span>
            </div>
            <div class="metric-pill">
              <span class="metric-label">Estimasi</span>
              <span class="metric-val">{{ estimatedRideTime(selectedItem.distanceMeters) }}</span>
            </div>
            <div class="metric-pill">
              <span class="metric-label">Kalori</span>
              <span class="metric-val">{{ estimatedCalories(selectedItem.distanceMeters, selectedItem.elevationGainMeters) }}</span>
            </div>
          </div>

          <!-- Route Elevation Interactive Sparkline -->
          <div
            v-if="selectedItem.kind === 'route'"
            class="route-spark-box"
            @mousemove="onElevationChartMouseMove"
            @mouseleave="onElevationChartMouseLeave"
          >
            <div class="spark-labels">
              <span>Profil Elevasi (+{{ selectedItem.elevationGainMeters }}m)</span>
              <span v-if="hoveredElevationDistance !== null" class="spark-hover-indicator">
                {{ (hoveredElevationDistance / 1000).toFixed(1) }} km
              </span>
              <span v-else-if="elevationData" class="spark-gradient">
                Avg {{ elevationData.averageGradientPercent }}% · Max {{ elevationData.maxGradientPercent }}%
              </span>
              <span v-else class="spark-difficulty">{{ selectedItem.difficulty }} · {{ selectedItem.surface }}</span>
            </div>

            <svg viewBox="0 0 300 50" class="spark-svg" aria-hidden="true">
              <defs>
                <linearGradient id="elevGradDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#0284c7" stop-opacity="0.45" />
                  <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05" />
                </linearGradient>
              </defs>
              <path
                :d="elevationFillPath || 'M0 40 Q 60 30, 120 22 T 240 10 L 300 6 L 300 50 L 0 50 Z'"
                fill="url(#elevGradDesktop)"
              />
              <path
                :d="elevationSvgPath || 'M0 40 Q 60 30, 120 22 T 240 10 L 300 6'"
                fill="none"
                stroke="#0284c7"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
            <span class="spark-hint-text">Arahkan kursor untuk menelusuri titik elevasi di peta</span>
          </div>

          <!-- Spot & Cycling Specs Card -->
          <div class="spot-specs-card">
            <div class="spec-row">
              <span class="spec-label">🚲 Rekomendasi Sepeda</span>
              <div class="spec-chips">
                <span v-for="bike in getSuitableBikes(selectedItem)" :key="bike" class="bike-spec-chip">
                  {{ bike }}
                </span>
              </div>
            </div>

            <div class="spec-row">
              <span class="spec-label">{{ selectedItem.kind === 'place' ? '✨ Fasilitas Spot' : '🛣️ Karakter Rute' }}</span>
              <div class="amenities-wrap">
                <span v-for="amenity in getPlaceAmenities(selectedItem)" :key="amenity.label" class="amenity-badge">
                  <span>{{ amenity.icon }}</span>
                  <span>{{ amenity.label }}</span>
                </span>
              </div>
            </div>
          </div>

          <p v-if="saveToast" class="save-toast-chip" role="status">{{ saveToast }}</p>

          <!-- Ergonomic Two-Tier Action Layout -->
          <div class="detail-action-hub">
            <NuxtLink
              class="primary-ride-cta"
              :to="`/safety?note=${encodeURIComponent(cleanName(selectedItem.name))}`"
            >
              <GIcon name="bike" size="sm" />
              <span>Mulai Sesi Gowes ke Sini</span>
              <span class="cta-arrow">➔</span>
            </NuxtLink>

            <div class="secondary-actions-grid">
              <button
                class="card-action-pill"
                type="button"
                title="Buka Navigasi di Google Maps"
                @click="openExternalNavigation(selectedItem, 'google')"
              >
                <span class="pill-icon">🗺️</span>
                <span>Google Maps</span>
              </button>

              <button
                class="card-action-pill"
                type="button"
                title="Buka Rute di Komoot"
                @click="openExternalNavigation(selectedItem, 'komoot')"
              >
                <span class="pill-icon">🌲</span>
                <span>Komoot</span>
              </button>

              <button
                class="card-action-pill"
                type="button"
                title="Bagikan Spot/Rute Ini"
                @click="shareSelectedItem(selectedItem)"
              >
                <GIcon name="share" size="xs" />
                <span>Bagikan</span>
              </button>

              <button
                class="card-action-pill"
                :class="{ 'card-action-pill--active': savedItems.has(selectedItem.id) }"
                type="button"
                :disabled="savingItem"
                @click="saveSelectedItem(selectedItem)"
              >
                <GIcon :name="savedItems.has(selectedItem.id) ? 'bookmark-filled' : 'bookmark'" size="xs" />
                <span>{{ savedItems.has(selectedItem.id) ? 'Tersimpan' : 'Simpan' }}</span>
              </button>

              <NuxtLink
                v-if="selectedItem.kind === 'route'"
                class="card-action-pill"
                :to="`/ride-flex?distance=${(selectedItem.distanceMeters / 1000).toFixed(1)}&elevation=${selectedItem.elevationGainMeters}&note=${encodeURIComponent(cleanName(selectedItem.name))}`"
              >
                <GIcon name="camera" size="xs" />
                <span>Poster AI</span>
              </NuxtLink>

              <button
                v-else
                class="card-action-pill"
                type="button"
                @click="showContributionsModal = true"
              >
                <span class="pill-icon">💬</span>
                <span>Ulasan / Info</span>
              </button>
            </div>
          </div>
        </article>

        <!-- B. Default Scrollable Spot & Track Feed -->
        <div v-else class="desktop-feed-wrapper">
          <div class="desktop-feed-meta">
            <span>Ditemukan <strong>{{ allItems.length }}</strong> tempat &amp; rute</span>
            <span class="active-radar-pill">● Radar Aktif</span>
          </div>

          <!-- Skeleton Shimmer Feed during Loading -->
          <div v-if="loading" class="desktop-feed-list">
            <div v-for="i in 4" :key="i" class="feed-card-row" style="pointer-events: none; border: 1px solid rgb(23 32 42 / 8%);">
              <div class="skeleton-shimmer" style="width: 2.35rem; height: 2.35rem; border-radius: 0.65rem; flex-shrink: 0;" />
              <div style="flex: 1; display: grid; gap: 0.35rem;">
                <div style="display: flex; justify-content: space-between;">
                  <div class="skeleton-shimmer" style="width: 55%; height: 1rem; border-radius: 0.3rem;" />
                  <div class="skeleton-shimmer" style="width: 20%; height: 0.85rem; border-radius: 0.3rem;" />
                </div>
                <div class="skeleton-shimmer" style="width: 85%; height: 0.75rem; border-radius: 0.3rem;" />
              </div>
            </div>
          </div>

          <div v-else class="desktop-feed-list">
            <p v-if="allItems.length === 0" class="empty-feed-hint">
              Tidak ada tempat atau rute yang cocok dengan filter.
            </p>
            <button
              v-for="item in allItems"
              :key="item.id"
              class="feed-card-row"
              type="button"
              @click="selectItem({ kind: item.kind, id: item.id })"
            >
              <div class="feed-card-icon" :style="{ background: item.kind === 'route' ? '#E0F2FE' : '#F7F4EB' }">
                <GIcon :name="getItemIconName(item)" size="md" color="#17202A" />
              </div>
              <div class="feed-card-body">
                <div class="feed-card-top">
                  <span class="feed-card-title">{{ cleanName(item.name) }}</span>
                  <span class="feed-card-dist">{{ formatDistance(itemDistance(item)) }}</span>
                </div>
                <p class="feed-card-desc">{{ cleanDescription(item.description) || 'Informasi rute & tempat gowes terverifikasi' }}</p>
                <div class="feed-card-tags">
                  <span class="tag-chip">{{ typeLabel(item) }}</span>
                  <span v-if="item.kind === 'route'" class="tag-chip tag-chip--highlight">+{{ item.elevationGainMeters }}m</span>
                  <span v-if="item.beginnerFriendly" class="tag-chip tag-chip--beginner">Ramah Pemula</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 3. MOBILE-ONLY TOP OVERLAY SEARCH -->
    <div class="mobile-top-overlay">
      <div class="search-pill-container">
        <span class="search-icon" aria-hidden="true">
          <GIcon name="search" size="xs" />
        </span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari rute, tanjakan, bengkel…"
          class="search-input"
        />
        <button
          class="overlay-icon-btn overlay-icon-btn--primary"
          type="button"
          title="Upload GPX atau Lapor Hazard"
          @click="showContributionsModal = true"
        >
          <GIcon name="plus" size="xs" color="#17202A" />
        </button>
        <button
          class="overlay-icon-btn"
          :class="{ 'overlay-icon-btn--active': userLocation !== null }"
          type="button"
          :title="locating ? 'Mencari lokasi…' : 'Lokasi Saya'"
          :disabled="locating"
          @click="useMyLocation"
        >
          <GIcon name="radar" size="xs" :color="userLocation !== null ? '#16A34A' : 'currentColor'" />
        </button>
        <button
          class="overlay-icon-btn"
          type="button"
          title="Rute Offline"
          @click="showOfflineModal = true"
        >
          <GIcon name="download" size="xs" />
        </button>
        <button
          class="overlay-icon-btn"
          type="button"
          title="Filter & Radius"
          @click="showFilterModal = !showFilterModal"
        >
          <GIcon name="filter" size="xs" />
        </button>
      </div>

      <!-- Quick Category Horizontal Pills (Mobile) -->
      <div class="category-scroll-strip">
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'all' }"
          type="button"
          @click="applyCategory('all')"
        >
          Semua ({{ allItems.length }})
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'routes' }"
          type="button"
          @click="applyCategory('routes')"
        >
          <GIcon name="route" size="xs" /> Rute
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'workshop' }"
          type="button"
          @click="applyCategory('workshop')"
        >
          <GIcon name="wrench" size="xs" /> Bengkel
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'store' }"
          type="button"
          @click="applyCategory('store')"
        >
          <GIcon name="shop" size="xs" /> Toko
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'coffee' }"
          type="button"
          @click="applyCategory('coffee')"
        >
          <GIcon name="coffee" size="xs" /> Kopi
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'water' }"
          type="button"
          @click="applyCategory('water')"
        >
          <GIcon name="water" size="xs" /> Air
        </button>
        <button
          class="cat-chip"
          :class="{ 'cat-chip--active': category === 'trailhead' }"
          type="button"
          @click="applyCategory('trailhead')"
        >
          <GIcon name="tree" size="xs" /> Trail
        </button>
      </div>
    </div>

    <!-- 4. MOBILE-ONLY DRAGGABLE BOTTOM SHEET (Above Bottom Navigation) -->
    <div
      class="mobile-bottom-sheet"
      :class="[
        `mobile-bottom-sheet--${sheetPosition}`,
        { 'mobile-bottom-sheet--dragging': isDraggingSheet },
        { 'mobile-bottom-sheet--selected': selectedItem !== null },
      ]"
      :style="sheetCustomHeight && !selectedItem ? { height: `${sheetCustomHeight}px` } : {}"
    >
      <!-- Touch/Grabber Area -->
      <div
        class="sheet-drag-touch-zone"
        role="button"
        tabindex="0"
        aria-label="Tarik atau ketuk untuk ubah tinggi panel"
        @touchstart.passive="onTouchStartDrag"
        @touchmove="onTouchMoveDrag"
        @touchend="onTouchEndDrag"
        @mousedown="onTouchStartDrag"
        @click="toggleSheetPosition"
      >
        <div class="sheet-grabber-bar" aria-hidden="true" />
      </div>

      <!-- A. Selected Spot View (Mobile) -->
      <article v-if="selectedItem" class="sheet-selected-card">
        <!-- Top Tag Stack & Dismiss Button -->
        <div class="card-headline-row">
          <div class="pill-badge-stack">
            <span class="type-pill" :class="`type-pill--${selectedItem.kind === 'place' ? selectedItem.type : selectedItem.routeType}`">
              {{ typeLabel(selectedItem) }}
            </span>
            <span class="dist-pill">📍 {{ formatDistance(itemDistance(selectedItem)) }}</span>
            <span v-if="selectedItem.verificationStatus === 'staff_verified'" class="verified-pill">
              ✓ Terverifikasi
            </span>
            <span v-if="selectedItem.beginnerFriendly" class="beginner-pill">
              🌱 Ramah Pemula
            </span>
          </div>
          <button class="dismiss-circle-btn" type="button" title="Tutup" @click="selectedId = null">✕</button>
        </div>

        <div class="card-title-group">
          <h2 class="card-item-title">{{ cleanName(selectedItem.name) }}</h2>
          <p class="card-item-desc">{{ cleanDescription(selectedItem.description) || 'Spot gowes rekomendasi komunitas.' }}</p>
        </div>

        <!-- Quick Telemetry Stats Grid for Routes (Mobile) -->
        <div v-if="selectedItem.kind === 'route'" class="route-metrics-grid">
          <div class="metric-pill">
            <span class="metric-label">Jarak</span>
            <span class="metric-val">{{ (selectedItem.distanceMeters / 1000).toFixed(1) }} <small>km</small></span>
          </div>
          <div class="metric-pill">
            <span class="metric-label">Elevasi</span>
            <span class="metric-val">+{{ selectedItem.elevationGainMeters }} <small>m</small></span>
          </div>
          <div class="metric-pill">
            <span class="metric-label">Estimasi</span>
            <span class="metric-val">{{ estimatedRideTime(selectedItem.distanceMeters) }}</span>
          </div>
          <div class="metric-pill">
            <span class="metric-label">Kalori</span>
            <span class="metric-val">{{ estimatedCalories(selectedItem.distanceMeters, selectedItem.elevationGainMeters) }}</span>
          </div>
        </div>

        <!-- Elevation Sparkline (Mobile) -->
        <div
          v-if="selectedItem.kind === 'route'"
          class="route-spark-box"
          @mousemove="onElevationChartMouseMove"
          @mouseleave="onElevationChartMouseLeave"
        >
          <div class="spark-labels">
            <span>+{{ selectedItem.elevationGainMeters }}m Elevasi</span>
            <span v-if="hoveredElevationDistance !== null" class="spark-hover-indicator">
              {{ (hoveredElevationDistance / 1000).toFixed(1) }} km
            </span>
            <span v-else-if="elevationData" class="spark-gradient">
              Avg {{ elevationData.averageGradientPercent }}% · Max {{ elevationData.maxGradientPercent }}%
            </span>
            <span v-else class="spark-difficulty">{{ selectedItem.difficulty }} · {{ selectedItem.surface }}</span>
          </div>
          <svg viewBox="0 0 300 50" class="spark-svg" aria-hidden="true">
            <defs>
              <linearGradient id="elevGradMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0284c7" stop-opacity="0.45" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05" />
              </linearGradient>
            </defs>
            <path
              :d="elevationFillPath || 'M0 40 Q 60 30, 120 22 T 240 10 L 300 6 L 300 50 L 0 50 Z'"
              fill="url(#elevGradMobile)"
            />
            <path
              :d="elevationSvgPath || 'M0 40 Q 60 30, 120 22 T 240 10 L 300 6'"
              fill="none"
              stroke="#0284c7"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <!-- Spot & Cycling Specs Card (Mobile) -->
        <div class="spot-specs-card">
          <div class="spec-row">
            <span class="spec-label">🚲 Rekomendasi Sepeda</span>
            <div class="spec-chips">
              <span v-for="bike in getSuitableBikes(selectedItem)" :key="bike" class="bike-spec-chip">
                {{ bike }}
              </span>
            </div>
          </div>

          <div class="spec-row">
            <span class="spec-label">{{ selectedItem.kind === 'place' ? '✨ Fasilitas Spot' : '🛣️ Karakter Rute' }}</span>
            <div class="amenities-wrap">
              <span v-for="amenity in getPlaceAmenities(selectedItem)" :key="amenity.label" class="amenity-badge">
                <span>{{ amenity.icon }}</span>
                <span>{{ amenity.label }}</span>
              </span>
            </div>
          </div>
        </div>

        <p v-if="saveToast" class="save-toast-chip" role="status">{{ saveToast }}</p>

        <!-- Ergonomic Two-Tier Action Layout (Mobile) -->
        <div class="detail-action-hub">
          <NuxtLink
            class="primary-ride-cta"
            :to="`/safety?note=${encodeURIComponent(cleanName(selectedItem.name))}`"
          >
            <GIcon name="bike" size="sm" />
            <span>Mulai Sesi Gowes ke Sini</span>
            <span class="cta-arrow">➔</span>
          </NuxtLink>

          <div class="secondary-actions-grid">
            <button
              class="card-action-pill"
              type="button"
              title="Buka Navigasi di Google Maps"
              @click="openExternalNavigation(selectedItem, 'google')"
            >
              <span class="pill-icon">🗺️</span>
              <span>Google Maps</span>
            </button>

            <button
              class="card-action-pill"
              type="button"
              title="Buka Rute di Komoot"
              @click="openExternalNavigation(selectedItem, 'komoot')"
            >
              <span class="pill-icon">🌲</span>
              <span>Komoot</span>
            </button>

            <button
              class="card-action-pill"
              type="button"
              title="Bagikan Spot/Rute Ini"
              @click="shareSelectedItem(selectedItem)"
            >
              <GIcon name="share" size="xs" />
              <span>Bagikan</span>
            </button>

            <button
              class="card-action-pill"
              :class="{ 'card-action-pill--active': savedItems.has(selectedItem.id) }"
              type="button"
              :disabled="savingItem"
              @click="saveSelectedItem(selectedItem)"
            >
              <GIcon :name="savedItems.has(selectedItem.id) ? 'bookmark-filled' : 'bookmark'" size="xs" />
              <span>{{ savedItems.has(selectedItem.id) ? 'Tersimpan' : 'Simpan' }}</span>
            </button>

            <NuxtLink
              v-if="selectedItem.kind === 'route'"
              class="card-action-pill"
              :to="`/ride-flex?distance=${(selectedItem.distanceMeters / 1000).toFixed(1)}&elevation=${selectedItem.elevationGainMeters}&note=${encodeURIComponent(cleanName(selectedItem.name))}`"
            >
              <GIcon name="camera" size="xs" />
              <span>Poster AI</span>
            </NuxtLink>

            <button
              v-else
              class="card-action-pill"
              type="button"
              @click="showContributionsModal = true"
            >
              <span class="pill-icon">💬</span>
              <span>Ulasan / Info</span>
            </button>
          </div>
        </div>
      </article>

      <!-- B. Spot Feed (Mobile) -->
      <div v-else class="sheet-feed-container">
        <div
          class="sheet-feed-header"
          role="button"
          tabindex="0"
          @click="toggleSheetPosition"
        >
          <strong>Spot &amp; Rute Gowes</strong>
          <div class="header-right-pills">
            <span class="feed-count-badge">{{ allItems.length }}</span>
            <span class="sheet-expand-hint">{{ sheetPosition === 'expanded' ? '▼' : '▲' }}</span>
          </div>
        </div>

        <div class="sheet-feed-list">
          <button
            v-for="item in allItems"
            :key="item.id"
            class="feed-card-row"
            type="button"
            @click="selectItem({ kind: item.kind, id: item.id })"
          >
            <div class="feed-card-icon" :style="{ background: item.kind === 'route' ? '#E0F2FE' : '#F7F4EB' }">
              <GIcon :name="getItemIconName(item)" size="md" color="#17202A" />
            </div>
            <div class="feed-card-body">
              <div class="feed-card-top">
                <span class="feed-card-title">{{ cleanName(item.name) }}</span>
                <span class="feed-card-dist">{{ formatDistance(itemDistance(item)) }}</span>
              </div>
              <p class="feed-card-desc">{{ cleanDescription(item.description) }}</p>
              <div class="feed-card-tags">
                <span class="tag-chip">{{ typeLabel(item) }}</span>
                <span v-if="item.kind === 'route'" class="tag-chip tag-chip--highlight">+{{ item.elevationGainMeters }}m</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- 5. FILTER & RADIUS MODAL -->
    <div v-if="showFilterModal" class="native-modal-backdrop" @click.self="showFilterModal = false">
      <div class="native-modal-sheet">
        <div class="modal-header">
          <h2>Filter &amp; Jarak Radar</h2>
          <button class="modal-close" type="button" @click="showFilterModal = false">✕</button>
        </div>
        <div class="modal-body-grid">
          <label>
            Radius Pencarian
            <select v-model="radiusKm" @change="loadNearby">
              <option :value="5">5 km (Sangat Dekat)</option>
              <option :value="10">10 km (Kota / Sekitar)</option>
              <option :value="15">15 km (Standar Gowes)</option>
              <option :value="25">25 km (Long Ride)</option>
              <option :value="50">50 km (Epic Tour)</option>
            </select>
          </label>
          <label>
            Tingkat Kesulitan
            <select v-model="difficulty" @change="loadNearby">
              <option value="all">Semua Tingkat</option>
              <option v-for="d in ROUTE_DIFFICULTIES" :key="d" :value="d">{{ d.toUpperCase() }}</option>
            </select>
          </label>
          <label>
            Tipe Sepeda
            <select v-model="bikeType" @change="loadNearby">
              <option value="all">Semua Tipe Sepeda</option>
              <option value="mtb_hardtail">MTB Hardtail</option>
              <option value="gravel">Gravel Bike</option>
              <option value="road">Road Bike</option>
              <option value="folding">Sepeda Lipat</option>
            </select>
          </label>
        </div>
        <button class="button button--primary button--full" type="button" @click="showFilterModal = false">
          Terapkan Filter
        </button>
      </div>
    </div>

    <!-- 6. CONTRIBUTIONS MODAL SHEET -->
    <div
      v-if="showContributionsModal"
      class="native-modal-backdrop"
      @click.self="showContributionsModal = false"
    >
      <div class="native-modal-sheet native-modal-sheet--large">
        <div class="modal-header">
          <h2>Kontribusi &amp; Ulasan Komunitas</h2>
          <button class="modal-close" type="button" @click="showContributionsModal = false">✕</button>
        </div>
        <div class="modal-scroll-body">
          <ExploreContributions :selected-item="selectedItem" />
        </div>
      </div>
    </div>

    <!-- Offline Routes Modal -->
    <OfflineRoutesModal
      :is-open="showOfflineModal"
      @close="showOfflineModal = false"
    />
  </div>
</template>

<style scoped>
/* Full-Bleed Map Viewport (Takes 100% of Screen on all devices) */
.native-map-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--color-sand);
}

.map-canvas-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map-loading-placeholder {
  display: grid;
  place-content: center;
  height: 100%;
  color: var(--color-asphalt);
  font-size: 0.85rem;
  font-weight: 750;
  background: var(--color-sand);
}

/* ═════════════════════════════════════════════════════════════
   DESKTOP FLOATING LEFT SIDEBAR (Apple Maps / Google Maps Web)
   ═════════════════════════════════════════════════════════════ */
.desktop-explore-panel {
  display: none;
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  bottom: 1.25rem;
  width: 26rem;
  max-width: calc(100vw - 2.5rem);
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 1.25rem;
  border: 1px solid rgb(23 32 42 / 12%);
  box-shadow: 0 16px 40px rgb(0 0 0 / 16%);
  z-index: 30;
  flex-direction: column;
  overflow: hidden;
  transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (min-width: 48rem) {
  .desktop-explore-panel {
    display: flex;
  }
  .mobile-top-overlay,
  .mobile-bottom-sheet {
    display: none !important;
  }
}

.desktop-explore-panel--collapsed {
  transform: translateX(calc(-100% + 3.2rem));
}

.panel-header {
  padding: 1rem 1rem 0.65rem;
  border-bottom: 1px solid rgb(23 32 42 / 08%);
  display: grid;
  gap: 0.65rem;
  background: var(--color-white);
  flex-shrink: 0;
}

.panel-brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-toggle-btn {
  border: none;
  background: var(--color-sand);
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--color-ink);
}

.panel-search-box {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.45rem 0.35rem 0.75rem;
  border-radius: 9999px;
  background: var(--color-sand);
  border: 1px solid rgb(23 32 42 / 08%);
}

.search-icon {
  font-size: 0.82rem;
  opacity: 0.55;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.8rem;
  font-weight: 750;
  color: var(--color-ink);
  min-width: 0;
}

.search-clear-btn {
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--color-asphalt);
  cursor: pointer;
  padding: 0.2rem;
}

.overlay-icon-btn {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  border: 1px solid rgb(23 32 42 / 10%);
  background: var(--color-white);
  color: var(--color-ink);
  font-size: 0.78rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 90ms ease;
}

.overlay-icon-btn:active {
  transform: scale(0.92);
}

.overlay-icon-btn--primary {
  background: var(--color-chain-lime);
  border-color: var(--color-ink);
  font-weight: 900;
}

.overlay-icon-btn--active {
  background: var(--color-chain-lime);
}

.category-scroll-strip {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
  scrollbar-width: none;
}

.category-scroll-strip::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  flex: 0 0 auto;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 10%);
  color: var(--color-ink);
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 120ms ease;
}

.cat-chip--active {
  background: var(--color-ink);
  color: var(--color-white);
  border-color: var(--color-ink);
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.85rem;
}

.desktop-selected-card {
  display: grid;
  gap: 0.75rem;
}

.desktop-feed-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.desktop-feed-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.74rem;
  color: var(--color-asphalt);
  padding: 0 0.2rem;
}

.active-radar-pill {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  color: #16a34a;
}

.desktop-feed-list {
  display: grid;
  gap: 0.5rem;
}

.empty-feed-hint {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  padding: 2rem 1rem;
}

/* ═════════════════════════════════════════════════════════════
   METRICS & ROUTE DETAILS
   ═════════════════════════════════════════════════════════════ */
.route-metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.metric-pill {
  background: rgb(237 228 210 / 45%);
  border: 1px solid rgb(23 32 42 / 08%);
  padding: 0.4rem 0.35rem;
  border-radius: 0.55rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-label {
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-asphalt);
}

.metric-val {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 900;
  color: var(--color-ink);
}

.route-spark-box {
  display: grid;
  gap: 0.25rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.75rem;
  background: rgb(237 228 210 / 30%);
  border: 1px solid var(--color-sand);
  cursor: crosshair;
}

.spark-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  font-weight: 850;
  color: var(--color-ink);
}

.spark-gradient {
  font-family: var(--font-mono);
  color: #0284c7;
  font-weight: 850;
}

.spark-hover-indicator {
  font-family: var(--font-mono);
  color: #16a34a;
  font-weight: 900;
}

.spark-hint-text {
  font-size: 0.58rem;
  color: var(--color-asphalt);
  opacity: 0.75;
  text-align: center;
}

.dismiss-circle-btn {
  display: grid;
  place-content: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 50%;
  background: var(--color-sand);
  border: 1px solid rgb(23 32 42 / 12%);
  color: var(--color-ink);
  font-size: 0.85rem;
  font-weight: 850;
  cursor: pointer;
  transition: transform 90ms ease, background 120ms ease;
  flex-shrink: 0;
}

.dismiss-circle-btn:active {
  transform: scale(0.92);
}

.card-headline-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.card-title-group {
  display: grid;
  gap: 0.25rem;
}

.pill-badge-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.type-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 900;
  text-transform: uppercase;
}

.type-pill--workshop { background: #c9f36a; color: #17202a; }
.type-pill--store { background: #8eddf4; color: #17202a; }
.type-pill--coffee { background: #fde68a; color: #92400e; }
.type-pill--water { background: #a5f3fc; color: #155e75; }
.type-pill--trailhead { background: #a7f3d0; color: #065f46; }
.type-pill--bike_park { background: #fecdd3; color: #9f1239; }
.type-pill--meeting_point { background: #ddd6fe; color: #5b21b6; }
.type-pill--rest { background: #ede4d2; color: #17202a; }

.type-pill--road { background: #bae6fd; color: #0369a1; }
.type-pill--gravel { background: #fed7aa; color: #9a3412; }
.type-pill--mtb { background: #bbf7d0; color: #166534; }

.dist-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: rgb(237 228 210 / 70%);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 850;
  color: var(--color-ink);
}

.verified-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.62rem;
  font-weight: 850;
}

.beginner-pill {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: #f0fdf4;
  color: #15803d;
  font-size: 0.62rem;
  font-weight: 850;
  border: 1px solid #bbf7d0;
}

.card-item-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 850;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.card-item-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-asphalt);
  line-height: 1.4;
}

/* Spot & Cycling Specs Card */
.spot-specs-card {
  background: rgb(237 228 210 / 35%);
  border: 1px solid rgb(23 32 42 / 09%);
  border-radius: 0.85rem;
  padding: 0.65rem 0.75rem;
  display: grid;
  gap: 0.55rem;
}

.spec-row {
  display: grid;
  gap: 0.3rem;
}

.spec-label {
  font-size: 0.64rem;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--color-asphalt);
  letter-spacing: -0.01em;
}

.spec-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.bike-spec-chip {
  font-size: 0.68rem;
  font-weight: 850;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 12%);
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  color: var(--color-ink);
}

.amenities-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.amenity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.68rem;
  font-weight: 800;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 10%);
  padding: 0.2rem 0.45rem;
  border-radius: 0.45rem;
  color: var(--color-ink);
}

/* ═════════════════════════════════════════════════════════════
   DETAIL ACTION HUB (2-Tier Ergonomic Layout)
   ═════════════════════════════════════════════════════════════ */
.detail-action-hub {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.primary-ride-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.72rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-chain-lime);
  color: var(--color-ink);
  font-weight: 900;
  font-size: 0.85rem;
  text-decoration: none;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 4px 12px rgb(201 243 106 / 45%);
  transition: transform 90ms ease, box-shadow 120ms ease;
  user-select: none;
}

.primary-ride-cta:active {
  transform: scale(0.97);
}

.cta-arrow {
  font-size: 0.9rem;
  transition: transform 120ms ease;
}

.primary-ride-cta:hover .cta-arrow {
  transform: translateX(3px);
}

.secondary-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.card-action-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.48rem 0.25rem;
  border-radius: 0.75rem;
  background: var(--color-white);
  border: 1px solid rgb(23 32 42 / 12%);
  color: var(--color-ink);
  font-size: 0.65rem;
  font-weight: 850;
  text-decoration: none;
  cursor: pointer;
  transition: all 120ms ease;
  user-select: none;
  text-align: center;
}

.card-action-pill:active {
  transform: scale(0.94);
}

.card-action-pill--active {
  background: #fef08a;
  border-color: #eab308;
  color: #854d0e;
}

.pill-icon {
  font-size: 0.9rem;
  line-height: 1;
}

/* Feed Cards */
.feed-card-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid var(--color-sand);
  background: var(--color-white);
  text-align: left;
  cursor: pointer;
  transition: all 120ms ease;
  width: 100%;
}

.feed-card-row:hover {
  border-color: var(--color-ink);
  box-shadow: 0 4px 12px rgb(0 0 0 / 06%);
}

.feed-card-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.65rem;
  display: grid;
  place-content: center;
  flex-shrink: 0;
  border: 1px solid rgb(23 32 42 / 08%);
}

.feed-card-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.feed-card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.feed-card-title {
  font-weight: 850;
  font-size: 0.88rem;
  color: var(--color-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-card-dist {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 900;
  color: var(--color-asphalt);
  flex-shrink: 0;
}

.feed-card-desc {
  margin: 0;
  font-size: 0.72rem;
  color: var(--color-asphalt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.feed-card-tags {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.15rem;
}

.tag-chip {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.08rem 0.35rem;
  border-radius: 0.3rem;
  background: rgb(237 228 210 / 60%);
  color: var(--color-ink);
  text-transform: capitalize;
}

.tag-chip--highlight {
  background: #e0f2fe;
  color: #0369a1;
  font-family: var(--font-mono);
}

.tag-chip--beginner {
  background: #dcfce7;
  color: #15803d;
}

/* ═════════════════════════════════════════════════════════════
   MOBILE-ONLY TOP OVERLAY & BOTTOM SHEET
   ═════════════════════════════════════════════════════════════ */
.mobile-top-overlay {
  position: absolute;
  top: max(0.85rem, var(--safe-top));
  left: 0.85rem;
  right: 0.85rem;
  display: grid;
  gap: 0.45rem;
  z-index: 20;
  pointer-events: none;
}

.mobile-top-overlay .search-pill-container {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.45rem 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgb(23 32 42 / 12%);
  box-shadow: 0 6px 20px rgb(0 0 0 / 12%);
  pointer-events: auto;
}

.mobile-top-overlay .category-scroll-strip {
  pointer-events: auto;
}

.mobile-bottom-sheet {
  position: absolute;
  bottom: max(4.2rem, calc(3.8rem + var(--safe-bottom)));
  left: 0;
  right: 0;
  background: rgb(255 255 255 / 96%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgb(23 32 42 / 08%);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  box-shadow: 0 -8px 30px rgb(0 0 0 / 16%);
  display: flex;
  flex-direction: column;
  z-index: 40;
  transition: height 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
  padding-bottom: 0.5rem;
}

.mobile-bottom-sheet--collapsed {
  height: 4.4rem;
  max-height: 4.4rem;
  overflow: hidden;
}

.mobile-bottom-sheet--half {
  height: calc(48vh - 4rem);
  max-height: calc(48vh - 4rem);
}

.mobile-bottom-sheet--expanded {
  height: calc(88vh - 4.5rem);
  max-height: calc(88vh - 4.5rem);
}

.mobile-bottom-sheet--selected {
  height: auto !important;
  max-height: calc(85vh - 4.2rem) !important;
  overflow: hidden;
}

.mobile-bottom-sheet--dragging {
  transition: none !important;
}

.sheet-drag-touch-zone {
  width: 100%;
  padding: 0.6rem 0 0.35rem;
  cursor: grab;
  touch-action: none;
  display: flex;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
}

.sheet-grabber-bar {
  width: 2.6rem;
  height: 0.3rem;
  border-radius: 9999px;
  background: rgb(15 23 42 / 25%);
}

.sheet-selected-card {
  padding: 0.35rem 1.1rem 0.85rem;
  display: grid;
  gap: 0.55rem;
  overflow-y: auto;
}

.sheet-feed-container {
  display: flex;
  flex-direction: column;
  padding: 0 0.85rem 0.65rem;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.sheet-feed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.45rem;
  font-size: 0.85rem;
  color: var(--color-ink);
  cursor: pointer;
  user-select: none;
}

.header-right-pills {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sheet-expand-hint {
  font-size: 0.65rem;
  color: var(--color-asphalt);
}

.feed-count-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background: rgb(201 243 106 / 50%);
}

.sheet-feed-list {
  display: grid;
  gap: 0.4rem;
  overflow-y: auto;
  padding-right: 0.2rem;
  -webkit-overflow-scrolling: touch;
}

.save-toast-chip {
  margin: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  background: #f0fdf4;
  color: #166534;
  font-size: 0.72rem;
  font-weight: 850;
  text-align: center;
  border: 1px solid #bbf7d0;
}

.dismiss-btn {
  border: none;
  background: none;
  font-size: 0.78rem;
  color: var(--color-asphalt);
  cursor: pointer;
  padding: 0.2rem;
  font-weight: 750;
}

/* Modals */
.native-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(4px);
  z-index: 60;
  display: grid;
  place-content: center;
  padding: 1rem;
}

.native-modal-sheet {
  background: var(--color-white);
  border-radius: 1.25rem;
  border: 1.5px solid var(--color-ink);
  box-shadow: 0 16px 40px rgb(0 0 0 / 25%);
  width: 22rem;
  max-width: calc(100vw - 2rem);
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
}

.native-modal-sheet--large {
  width: 32rem;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 850;
}

.modal-close {
  border: none;
  background: var(--color-sand);
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  cursor: pointer;
  font-weight: 850;
}

.modal-body-grid {
  display: grid;
  gap: 0.85rem;
}

.modal-body-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 800;
}

.modal-body-grid select {
  padding: 0.55rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(23 32 42 / 20%);
  background: var(--color-sand);
  font-weight: 750;
  font-size: 0.82rem;
}
</style>
