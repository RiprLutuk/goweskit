<script setup lang="ts">
export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
  gradePct?: number;
}

const props = withDefaults(
  defineProps<{
    distanceKm: number;
    elevationGainM: number;
    elevationPoints?: ElevationPoint[];
    climbCategory?: string;
    showControls?: boolean;
  }>(),
  {
    elevationPoints: () => [],
    climbCategory: 'Cat 2 Mountain Pass',
    showControls: true,
  },
);

const svgRef = ref<SVGSVGElement | null>(null);
const activeHoverIndex = ref<number | null>(null);

// Generate synthetic smooth elevation points if raw points not provided
const computedPoints = computed<ElevationPoint[]>(() => {
  if (props.elevationPoints && props.elevationPoints.length >= 5) {
    return props.elevationPoints;
  }

  const dist = Math.max(props.distanceKm, 5);
  const elev = Math.max(props.elevationGainM, 50);
  const steps = 30;
  const pts: ElevationPoint[] = [];

  const baseEle = 120;
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const currentDist = Number((progress * dist).toFixed(1));

    // Realistic elevation curve with a major punchy climb and rolling waves
    const wave1 = Math.sin(progress * Math.PI * 2) * (elev * 0.15);
    const mainClimb =
      Math.sin(Math.pow(progress, 1.2) * Math.PI) * (elev * 0.75);
    const jitter = Math.sin(progress * 12) * (elev * 0.05);

    const currentEle = Math.max(
      baseEle,
      Math.round(baseEle + mainClimb + wave1 + jitter),
    );
    pts.push({
      distanceKm: currentDist,
      elevationM: currentEle,
      gradePct: Number(
        (
          ((Math.sin(progress * Math.PI * 3) + 1) / 2) * 8 +
          (progress > 0.4 && progress < 0.7 ? 5 : 1)
        ).toFixed(1),
      ),
    });
  }
  return pts;
});

const minElevation = computed(() => {
  return Math.min(...computedPoints.value.map((p) => p.elevationM));
});

const maxElevation = computed(() => {
  return Math.max(...computedPoints.value.map((p) => p.elevationM));
});

const maxGradient = computed(() => {
  return Math.max(...computedPoints.value.map((p) => p.gradePct || 0));
});

const chartWidth = 500;
const chartHeight = 160;
const paddingX = 35;
const paddingY = 25;

const effectiveW = chartWidth - paddingX * 2;
const effectiveH = chartHeight - paddingY * 2;

const projectedPoints = computed(() => {
  const pts = computedPoints.value;
  if (pts.length === 0) return [];

  const minE = minElevation.value;
  const maxE = Math.max(maxElevation.value, minE + 10);
  const totalD = Math.max(props.distanceKm, 1);

  return pts.map((p) => {
    const x = paddingX + (p.distanceKm / totalD) * effectiveW;
    const y =
      chartHeight -
      paddingY -
      ((p.elevationM - minE) / (maxE - minE)) * effectiveH;
    return { x, y, ...p };
  });
});

const areaPathD = computed(() => {
  const pts = projectedPoints.value;
  if (pts.length < 2) return '';

  let d = `M ${pts[0]!.x} ${chartHeight - paddingY}`;
  d += ` L ${pts[0]!.x} ${pts[0]!.y}`;

  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }

  const last = pts[pts.length - 1]!;
  d += ` L ${last.x.toFixed(1)} ${chartHeight - paddingY} Z`;
  return d;
});

const linePathD = computed(() => {
  const pts = projectedPoints.value;
  if (pts.length < 2) return '';

  let d = `M ${pts[0]!.x.toFixed(1)} ${pts[0]!.y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return d;
});

const hoveredPoint = computed(() => {
  if (activeHoverIndex.value === null) return null;
  return projectedPoints.value[activeHoverIndex.value] || null;
});

function handleMouseMove(event: MouseEvent) {
  if (!svgRef.value) return;
  const rect = svgRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const relativeX = (mouseX / rect.width) * chartWidth;

  let closestIdx = 0;
  let minDiff = Infinity;

  projectedPoints.value.forEach((pt, idx) => {
    const diff = Math.abs(pt.x - relativeX);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });

  activeHoverIndex.value = closestIdx;
}

function handleMouseLeave() {
  activeHoverIndex.value = null;
}
</script>

<template>
  <div class="elevation-chart-container">
    <div class="elevation-header">
      <div class="header-left">
        <GIcon name="mountain" size="xs" color="var(--color-chain-lime)" />
        <strong>Profil Elevasi &amp; Gradien</strong>
      </div>
      <div class="header-badges">
        <span class="badge-climb-cat">⛰️ {{ climbCategory }}</span>
        <span class="badge-max-grade">⚡ Max {{ maxGradient }}%</span>
      </div>
    </div>

    <!-- SVG Area Chart -->
    <div class="svg-wrapper">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        class="elevation-svg"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <defs>
          <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.65" />
            <stop offset="70%" stop-color="#C9F36A" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#080D19" stop-opacity="0.05" />
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line
          :x1="paddingX"
          :y1="paddingY"
          :x2="chartWidth - paddingX"
          :y2="paddingY"
          stroke="rgba(255, 255, 255, 0.08)"
          stroke-dasharray="3 3"
        />
        <line
          :x1="paddingX"
          :y1="chartHeight / 2"
          :x2="chartWidth - paddingX"
          :y2="chartHeight / 2"
          stroke="rgba(255, 255, 255, 0.08)"
          stroke-dasharray="3 3"
        />
        <line
          :x1="paddingX"
          :y1="chartHeight - paddingY"
          :x2="chartWidth - paddingX"
          :y2="chartHeight - paddingY"
          stroke="rgba(255, 255, 255, 0.15)"
        />

        <!-- Elevation Area & Stroke -->
        <path :d="areaPathD" fill="url(#elevationGrad)" />
        <path
          :d="linePathD"
          fill="none"
          stroke="#38BDF8"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Y-Axis Labels -->
        <text
          :x="paddingX - 4"
          :y="paddingY + 3"
          fill="#94A3B8"
          font-size="8"
          font-family="monospace"
          text-anchor="end"
        >
          {{ maxElevation }}m
        </text>
        <text
          :x="paddingX - 4"
          :y="chartHeight - paddingY"
          fill="#94A3B8"
          font-size="8"
          font-family="monospace"
          text-anchor="end"
        >
          {{ minElevation }}m
        </text>

        <!-- X-Axis Labels -->
        <text
          :x="paddingX"
          :y="chartHeight - 8"
          fill="#64748B"
          font-size="8"
          font-family="monospace"
        >
          0 km
        </text>
        <text
          :x="chartWidth / 2"
          :y="chartHeight - 8"
          fill="#64748B"
          font-size="8"
          font-family="monospace"
          text-anchor="middle"
        >
          {{ (distanceKm / 2).toFixed(1) }} km
        </text>
        <text
          :x="chartWidth - paddingX"
          :y="chartHeight - 8"
          fill="#64748B"
          font-size="8"
          font-family="monospace"
          text-anchor="end"
        >
          {{ distanceKm }} km
        </text>

        <!-- Interactive Hover Cursor -->
        <g v-if="hoveredPoint">
          <line
            :x1="hoveredPoint.x"
            :y1="paddingY"
            :x2="hoveredPoint.x"
            :y2="chartHeight - paddingY"
            stroke="#C9F36A"
            stroke-width="1.5"
            stroke-dasharray="2 2"
          />
          <circle
            :cx="hoveredPoint.x"
            :cy="hoveredPoint.y"
            r="4.5"
            fill="#C9F36A"
            stroke="#080D19"
            stroke-width="2"
          />
        </g>
      </svg>

      <!-- Tooltip Floating Box -->
      <div
        v-if="hoveredPoint"
        class="chart-tooltip"
        :style="{
          left: `${(hoveredPoint.x / chartWidth) * 100}%`,
          top: `${Math.max(10, (hoveredPoint.y / chartHeight) * 100 - 35)}%`,
        }"
      >
        <span class="tt-dist">{{ hoveredPoint.distanceKm }} km</span>
        <span class="tt-ele"
          >{{ hoveredPoint.elevationM }}m (+{{ hoveredPoint.gradePct }}%)</span
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.elevation-chart-container {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.elevation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 850;
  color: #f8fafc;
}

.header-badges {
  display: flex;
  gap: 0.35rem;
}

.badge-climb-cat {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.badge-max-grade {
  font-size: 0.65rem;
  font-weight: 850;
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
  background: rgba(201, 243, 106, 0.12);
  color: var(--color-chain-lime);
  border: 1px solid rgba(201, 243, 106, 0.3);
}

.svg-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.elevation-svg {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #0f172a;
  border: 1px solid var(--color-chain-lime);
  border-radius: 0.4rem;
  padding: 0.2rem 0.45rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  z-index: 10;
}

.tt-dist {
  font-size: 0.62rem;
  font-weight: 800;
  color: #94a3b8;
}

.tt-ele {
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--color-chain-lime);
}
</style>
