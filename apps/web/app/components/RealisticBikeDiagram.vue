<script setup lang="ts">
import type { BicycleAnatomy } from '@goweskit/contracts';

const props = defineProps<{
  typeSlug: string;
  anatomy: BicycleAnatomy;
  activeIndex: number | null;
}>();

const emit = defineEmits<{
  select: [index: number | null];
}>();

const hoveredIndex = ref<number | null>(null);

// Find hotspot index by component slug
function findHotspotIndex(partSlug: string): number {
  return props.anatomy.hotspots.findIndex(
    (h) => h.component.slug === partSlug,
  );
}

function isPartHighlighted(partSlugs: string[]): boolean {
  const currentIdx = props.activeIndex !== null ? props.activeIndex : hoveredIndex.value;
  if (currentIdx === null || currentIdx < 0) return false;
  const hotspot = props.anatomy.hotspots[currentIdx];
  if (!hotspot) return false;
  return partSlugs.includes(hotspot.component.slug);
}

function handlePartClick(primarySlug: string, fallbackSlug?: string): void {
  let idx = findHotspotIndex(primarySlug);
  if (idx === -1 && fallbackSlug) {
    idx = findHotspotIndex(fallbackSlug);
  }
  if (idx !== -1) {
    emit('select', props.activeIndex === idx ? null : idx);
  }
}

function handlePartHover(primarySlug: string, fallbackSlug?: string): void {
  let idx = findHotspotIndex(primarySlug);
  if (idx === -1 && fallbackSlug) {
    idx = findHotspotIndex(fallbackSlug);
  }
  if (idx !== -1) {
    hoveredIndex.value = idx;
  }
}

function clearHover(): void {
  hoveredIndex.value = null;
}

// Active hotspot for popover (selected has priority over hovered)
const displayedHotspot = computed(() => {
  const idx = props.activeIndex !== null ? props.activeIndex : hoveredIndex.value;
  if (idx === null || idx < 0) return null;
  const hotspot = props.anatomy.hotspots[idx];
  if (!hotspot) return null;
  return {
    hotspot,
    index: idx,
    isLocked: props.activeIndex !== null,
  };
});

const popoverPlacement = computed(() => {
  if (!displayedHotspot.value) return { isTop: false, left: 50, top: 50 };
  const h = displayedHotspot.value.hotspot;
  // If part is in the upper half of the bike (y < 46%), place the popover below it
  const isTop = h.yPercent < 46;
  const clampedX = Math.max(26, Math.min(74, h.xPercent));
  return {
    isTop,
    left: clampedX,
    top: isTop ? h.yPercent + 4 : h.yPercent - 4,
  };
});

function closePopover(): void {
  emit('select', null);
  hoveredIndex.value = null;
}
</script>

<template>
  <div
    class="realistic-diagram-wrapper"
    :class="[`diagram--${typeSlug}`, { 'has-active-part': displayedHotspot !== null }]"
    @mouseleave="clearHover"
  >
    <!-- Top Interactive Hint Bar -->
    <div class="interactive-hint-bar">
      <span class="hint-pulse-dot" />
      <span class="hint-text">Interactive Blueprint · Click or hover any bike component</span>
    </div>

    <svg
      viewBox="0 0 1000 700"
      class="realistic-bike-svg"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Interactive realistic bicycle anatomy blueprint"
    >
      <defs>
        <!-- Gradients -->
        <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="50%" stop-color="#334155" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>

        <linearGradient id="forkStanchionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d4af37" />
          <stop offset="50%" stop-color="#f3e5ab" />
          <stop offset="100%" stop-color="#aa8c2c" />
        </linearGradient>

        <linearGradient id="tireTreadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18181b" />
          <stop offset="100%" stop-color="#27272a" />
        </linearGradient>

        <linearGradient id="rotorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>

        <!-- Hover & Selection Glow Filter -->
        <filter id="partGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#c9f36a" flood-opacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#8eddf4" flood-opacity="0.75" />
        </filter>
      </defs>

      <!-- Technical Blueprint Axis & Alignments -->
      <g class="blueprint-grid" opacity="0.35">
        <line x1="60" y1="620" x2="940" y2="620" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 6" />
        <line x1="240" y1="200" x2="240" y2="620" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="800" y1="200" x2="800" y2="620" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4" />
        <line x1="510" y1="350" x2="510" y2="620" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4" />
      </g>

      <!-- ============================================================== -->
      <!-- TYPE A: MTB HARDTAIL (Sloped Frame, Suspension Fork, 29er) -->
      <!-- ============================================================== -->
      <g v-if="typeSlug === 'mtb_hardtail' || typeSlug === 'default'" class="bike-layer mtb-geometry">
        
        <!-- 1. REAR WHEEL & TIRE -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="Rear Wheel & Tire"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <!-- Tire with Chunky Knobby Treads -->
          <circle cx="800" cy="480" r="140" fill="none" stroke="url(#tireTreadGrad)" stroke-width="26" />
          <circle cx="800" cy="480" r="153" fill="none" stroke="#27272a" stroke-width="4" stroke-dasharray="6 10" />
          <circle cx="800" cy="480" r="127" fill="none" stroke="#0f172a" stroke-width="4" />
          <!-- Rim -->
          <circle cx="800" cy="480" r="122" fill="none" stroke="#334155" stroke-width="8" />
          <path d="M 720 400 A 122 122 0 0 1 760 365" fill="none" stroke="#c9f36a" stroke-width="5" />
          <!-- Spokes (32H Cross) -->
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`r1-${deg}`"
              :x1="800 + 20 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 20 * Math.sin(deg * Math.PI / 180)"
              :x2="800 + 120 * Math.cos((deg + 30) * Math.PI / 180)"
              :y2="480 + 120 * Math.sin((deg + 30) * Math.PI / 180)"
            />
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`r2-${deg}`"
              :x1="800 + 20 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 20 * Math.sin(deg * Math.PI / 180)"
              :x2="800 + 120 * Math.cos((deg - 30) * Math.PI / 180)"
              :y2="480 + 120 * Math.sin((deg - 30) * Math.PI / 180)"
            />
          </g>
          <circle cx="800" cy="480" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="3" />
        </g>

        <!-- 2. FRONT WHEEL & TIRE -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="Front Wheel & Tire"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <circle cx="240" cy="480" r="140" fill="none" stroke="url(#tireTreadGrad)" stroke-width="26" />
          <circle cx="240" cy="480" r="153" fill="none" stroke="#27272a" stroke-width="4" stroke-dasharray="6 10" />
          <circle cx="240" cy="480" r="127" fill="none" stroke="#0f172a" stroke-width="4" />
          <circle cx="240" cy="480" r="122" fill="none" stroke="#334155" stroke-width="8" />
          <path d="M 160 400 A 122 122 0 0 1 200 365" fill="none" stroke="#c9f36a" stroke-width="5" />
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`fw1-${deg}`"
              :x1="240 + 20 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 20 * Math.sin(deg * Math.PI / 180)"
              :x2="240 + 120 * Math.cos((deg + 30) * Math.PI / 180)"
              :y2="480 + 120 * Math.sin((deg + 30) * Math.PI / 180)"
            />
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`fw2-${deg}`"
              :x1="240 + 20 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 20 * Math.sin(deg * Math.PI / 180)"
              :x2="240 + 120 * Math.cos((deg - 30) * Math.PI / 180)"
              :y2="480 + 120 * Math.sin((deg - 30) * Math.PI / 180)"
            />
          </g>
          <circle cx="240" cy="480" r="22" fill="#1e293b" stroke="#0f172a" stroke-width="3" />
        </g>

        <!-- 3. DISC BRAKE ROTORS & CALIPERS -->
        <g
          class="part-interactive part--brake"
          :class="{ 'part--active': isPartHighlighted(['brake', 'rotor']) }"
          role="button"
          tabindex="0"
          aria-label="Hydraulic Disc Brake"
          @click="handlePartClick('brake', 'rotor')"
          @mouseenter="handlePartHover('brake', 'rotor')"
        >
          <!-- Front 180mm Rotor & Caliper -->
          <circle cx="240" cy="480" r="48" fill="none" stroke="url(#rotorGrad)" stroke-width="9" />
          <circle cx="240" cy="480" r="48" fill="none" stroke="#1e293b" stroke-width="3" stroke-dasharray="5 7" />
          <line x1="240" y1="440" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <line x1="205" y1="460" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <line x1="205" y1="500" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <line x1="240" y1="520" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <line x1="275" y1="500" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <line x1="275" y1="460" x2="240" y2="480" stroke="#64748b" stroke-width="4" />
          <rect x="200" y="440" width="22" height="34" rx="4" fill="#0f172a" stroke="#c9f36a" stroke-width="2" />

          <!-- Rear 160mm Rotor & Caliper -->
          <circle cx="800" cy="480" r="42" fill="none" stroke="url(#rotorGrad)" stroke-width="8" />
          <circle cx="800" cy="480" r="42" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-dasharray="4 6" />
          <rect x="765" y="450" width="20" height="30" rx="4" fill="#0f172a" stroke="#c9f36a" stroke-width="2" />
        </g>

        <!-- 4. CASSETTE, REAR DERAILLEUR & CHAIN -->
        <g
          class="part-interactive part--cassette"
          :class="{ 'part--active': isPartHighlighted(['cassette', 'rear_derailleur']) }"
          role="button"
          tabindex="0"
          aria-label="Cassette & Rear Derailleur"
          @click="handlePartClick('cassette', 'rear_derailleur')"
          @mouseenter="handlePartHover('cassette', 'rear_derailleur')"
        >
          <!-- Cassette Cogs -->
          <circle cx="800" cy="480" r="54" fill="none" stroke="#64748b" stroke-width="4" stroke-dasharray="4 3" />
          <circle cx="800" cy="480" r="44" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="4 3" />
          <circle cx="800" cy="480" r="34" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4 3" />
          <circle cx="800" cy="480" r="24" fill="none" stroke="#e2e8f0" stroke-width="3" />
          
          <!-- Rear Derailleur Body & Clutch -->
          <path d="M 800 480 L 835 505 L 850 540" fill="none" stroke="#0f172a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="835" cy="505" r="7" fill="#c9f36a" />
          <!-- Derailleur Pulleys -->
          <circle cx="838" cy="510" r="11" fill="#1e293b" stroke="#64748b" stroke-width="2" />
          <circle cx="850" cy="545" r="11" fill="#1e293b" stroke="#64748b" stroke-width="2" />
          <line x1="838" y1="510" x2="850" y2="545" stroke="#334155" stroke-width="5" />

          <!-- Chain -->
          <path d="M 510 495 L 800 460 M 850 545 L 510 505" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-dasharray="5 3" />
        </g>

        <!-- 5. CRANKSET & BOTTOM BRACKET -->
        <g
          class="part-interactive part--crank"
          :class="{ 'part--active': isPartHighlighted(['crank', 'bottom_bracket', 'pedal']) }"
          role="button"
          tabindex="0"
          aria-label="Crankset & Bottom Bracket"
          @click="handlePartClick('crank', 'bottom_bracket')"
          @mouseenter="handlePartHover('crank', 'bottom_bracket')"
        >
          <!-- 32T Chainring -->
          <circle cx="510" cy="480" r="42" fill="none" stroke="#0f172a" stroke-width="8" stroke-dasharray="6 4" />
          <circle cx="510" cy="480" r="32" fill="#1e293b" stroke="#334155" stroke-width="3" />
          
          <!-- Crank Arms -->
          <path d="M 510 480 L 460 545" fill="none" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
          <path d="M 510 480 L 560 415" fill="none" stroke="#334155" stroke-width="12" stroke-linecap="round" opacity="0.6" />
          
          <!-- Flat MTB Platform Pedal -->
          <rect x="440" y="538" width="36" height="14" rx="3" fill="#1e293b" stroke="#c9f36a" stroke-width="2" />
          <circle cx="460" cy="545" r="3" fill="#ffffff" />
          <line x1="443" y1="535" x2="443" y2="538" stroke="#c9f36a" stroke-width="2" />
          <line x1="473" y1="535" x2="473" y2="538" stroke="#c9f36a" stroke-width="2" />

          <!-- BB Center -->
          <circle cx="510" cy="480" r="16" fill="#c9f36a" stroke="#0f172a" stroke-width="3" />
        </g>

        <!-- 6. MTB FRAME -->
        <g
          class="part-interactive part--frame"
          :class="{ 'part--active': isPartHighlighted(['frame']) }"
          role="button"
          tabindex="0"
          aria-label="Main Frame"
          @click="handlePartClick('frame')"
          @mouseenter="handlePartHover('frame')"
        >
          <!-- Headtube -->
          <path d="M 320 220 L 305 275" stroke="url(#frameGradient)" stroke-width="28" stroke-linecap="round" />
          <!-- Down Tube -->
          <path d="M 308 265 L 505 475" stroke="url(#frameGradient)" stroke-width="32" stroke-linecap="round" />
          <path d="M 308 265 L 505 475" stroke="#475569" stroke-width="4" stroke-linecap="round" opacity="0.5" />
          <!-- Sloped Top Tube -->
          <path d="M 318 230 L 600 320" stroke="url(#frameGradient)" stroke-width="24" stroke-linecap="round" />
          <!-- Seat Tube -->
          <path d="M 600 310 L 510 480" stroke="url(#frameGradient)" stroke-width="26" stroke-linecap="round" />
          <!-- Stays -->
          <path d="M 595 320 L 800 480" stroke="url(#frameGradient)" stroke-width="18" stroke-linecap="round" />
          <path d="M 510 480 L 800 480" stroke="url(#frameGradient)" stroke-width="22" stroke-linecap="round" />
          <!-- Decal -->
          <path d="M 350 295 L 480 435" stroke="#c9f36a" stroke-width="5" stroke-linecap="round" />
        </g>

        <!-- 7. SUSPENSION FORK -->
        <g
          class="part-interactive part--fork"
          :class="{ 'part--active': isPartHighlighted(['fork']) }"
          role="button"
          tabindex="0"
          aria-label="Front Suspension Fork"
          @click="handlePartClick('fork')"
          @mouseenter="handlePartHover('fork')"
        >
          <!-- Fork Crown -->
          <path d="M 300 280 L 320 270" stroke="#0f172a" stroke-width="22" stroke-linecap="round" />
          <!-- Golden Stanchions -->
          <path d="M 305 285 L 280 365" stroke="url(#forkStanchionGrad)" stroke-width="16" stroke-linecap="round" />
          <!-- Arch & Seals -->
          <circle cx="280" cy="365" r="9" fill="#0f172a" />
          <path d="M 285 365 C 275 350, 260 350, 255 368" fill="none" stroke="#0f172a" stroke-width="10" stroke-linecap="round" />
          <!-- Lowers -->
          <path d="M 280 370 L 240 480" stroke="url(#frameGradient)" stroke-width="22" stroke-linecap="round" />
          <circle cx="240" cy="480" r="12" fill="#0f172a" stroke="#c9f36a" stroke-width="3" />
        </g>

        <!-- 8. SEATPOST & SADDLE -->
        <g
          class="part-interactive part--seat"
          :class="{ 'part--active': isPartHighlighted(['saddle', 'seatpost']) }"
          role="button"
          tabindex="0"
          aria-label="Saddle & Seatpost"
          @click="handlePartClick('saddle', 'seatpost')"
          @mouseenter="handlePartHover('saddle', 'seatpost')"
        >
          <!-- Dropper Post -->
          <path d="M 600 315 L 635 220" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
          <rect x="590" y="305" width="22" height="12" rx="3" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <!-- Saddle -->
          <path d="M 620 220 L 650 215" stroke="#64748b" stroke-width="6" stroke-linecap="round" />
          <path d="M 580 205 C 620 195, 665 195, 680 215 C 670 225, 640 220, 620 215 Z" fill="#0f172a" stroke="#c9f36a" stroke-width="2" />
          <path d="M 600 207 C 625 200, 650 200, 665 212" fill="none" stroke="#38bdf8" stroke-width="3" />
        </g>

        <!-- 9. COCKPIT (Stem, Handlebar, Grips) -->
        <g
          class="part-interactive part--cockpit"
          :class="{ 'part--active': isPartHighlighted(['handlebar', 'stem', 'shifter']) }"
          role="button"
          tabindex="0"
          aria-label="Handlebar & Stem Cockpit"
          @click="handlePartClick('handlebar', 'stem')"
          @mouseenter="handlePartHover('handlebar', 'stem')"
        >
          <rect x="312" y="200" width="18" height="22" rx="2" fill="#334155" />
          <!-- Stem -->
          <path d="M 322 205 L 300 190" stroke="#0f172a" stroke-width="22" stroke-linecap="round" />
          <circle cx="300" cy="190" r="11" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <!-- Riser Bar -->
          <path d="M 270 185 C 290 195, 310 195, 335 180" fill="none" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
          <!-- Grip -->
          <rect x="252" y="175" width="30" height="14" rx="4" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <line x1="257" y1="175" x2="257" y2="189" stroke="#0f172a" stroke-width="2" />
          <line x1="277" y1="175" x2="277" y2="189" stroke="#0f172a" stroke-width="2" />
          <!-- Brake Lever -->
          <path d="M 280 188 L 265 205" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        </g>
      </g>

      <!-- ============================================================== -->
      <!-- TYPE B: FOLDING BIKE (20" Wheels, Central Hinge, Tall Stem) -->
      <!-- ============================================================== -->
      <g v-else-if="typeSlug === 'folding'" class="bike-layer folding-geometry">
        
        <!-- 1. COMPACT 20" REAR WHEEL -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="20-inch Rear Wheel & Tire"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <circle cx="790" cy="520" r="100" fill="none" stroke="url(#tireTreadGrad)" stroke-width="22" />
          <circle cx="790" cy="520" r="110" fill="none" stroke="#27272a" stroke-width="3" />
          <circle cx="790" cy="520" r="88" fill="none" stroke="#334155" stroke-width="8" />
          <path d="M 730 460 A 88 88 0 0 1 760 435" fill="none" stroke="#c9f36a" stroke-width="4" />
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]" :key="`flr-${deg}`"
              :x1="790 + 15 * Math.cos(deg * Math.PI / 180)"
              :y1="520 + 15 * Math.sin(deg * Math.PI / 180)"
              :x2="790 + 88 * Math.cos(deg * Math.PI / 180)"
              :y2="520 + 88 * Math.sin(deg * Math.PI / 180)"
            />
          </g>
          <circle cx="790" cy="520" r="18" fill="#1e293b" stroke="#0f172a" stroke-width="2.5" />
        </g>

        <!-- 2. COMPACT 20" FRONT WHEEL -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="20-inch Front Wheel & Tire"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <circle cx="270" cy="520" r="100" fill="none" stroke="url(#tireTreadGrad)" stroke-width="22" />
          <circle cx="270" cy="520" r="110" fill="none" stroke="#27272a" stroke-width="3" />
          <circle cx="270" cy="520" r="88" fill="none" stroke="#334155" stroke-width="8" />
          <path d="M 210 460 A 88 88 0 0 1 240 435" fill="none" stroke="#c9f36a" stroke-width="4" />
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]" :key="`flf-${deg}`"
              :x1="270 + 15 * Math.cos(deg * Math.PI / 180)"
              :y1="520 + 15 * Math.sin(deg * Math.PI / 180)"
              :x2="270 + 88 * Math.cos(deg * Math.PI / 180)"
              :y2="520 + 88 * Math.sin(deg * Math.PI / 180)"
            />
          </g>
          <circle cx="270" cy="520" r="18" fill="#1e293b" stroke="#0f172a" stroke-width="2.5" />
        </g>

        <!-- 3. DRIVETRAIN (53T Chainring & Cassette) -->
        <g
          class="part-interactive part--crank"
          :class="{ 'part--active': isPartHighlighted(['crank', 'cassette', 'bottom_bracket']) }"
          role="button"
          tabindex="0"
          aria-label="Crankset & Drivetrain"
          @click="handlePartClick('crank', 'cassette')"
          @mouseenter="handlePartHover('crank', 'cassette')"
        >
          <!-- 53T Chainring with Chain Guard -->
          <circle cx="510" cy="520" r="48" fill="none" stroke="#0f172a" stroke-width="8" />
          <circle cx="510" cy="520" r="54" fill="none" stroke="#38bdf8" stroke-width="3" />
          <path d="M 510 520 L 465 575" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
          <rect x="445" y="568" width="32" height="12" rx="3" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <!-- Cassette & Short Derailleur -->
          <circle cx="790" cy="520" r="38" fill="none" stroke="#64748b" stroke-width="4" stroke-dasharray="3 3" />
          <circle cx="790" cy="520" r="26" fill="none" stroke="#cbd5e1" stroke-width="3" />
          <path d="M 790 520 L 815 540 L 825 565" fill="none" stroke="#0f172a" stroke-width="7" stroke-linecap="round" />
          <circle cx="825" cy="565" r="8" fill="#1e293b" stroke="#c9f36a" stroke-width="2" />
          <path d="M 510 472 L 790 495 M 825 565 L 510 568" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4 2" />
        </g>

        <!-- 4. FOLDING MONO FRAME & CENTRAL HINGE -->
        <g
          class="part-interactive part--frame"
          :class="{ 'part--active': isPartHighlighted(['frame', 'folding_hinge']) }"
          role="button"
          tabindex="0"
          aria-label="Folding Frame & Central Hinge"
          @click="handlePartClick('folding_hinge', 'frame')"
          @mouseenter="handlePartHover('folding_hinge', 'frame')"
        >
          <path d="M 590 420 L 790 520" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
          <path d="M 510 520 L 790 520" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
          <path d="M 330 380 Q 420 440, 590 420" fill="none" stroke="url(#frameGradient)" stroke-width="36" stroke-linecap="round" />
          <path d="M 590 420 L 510 520" stroke="url(#frameGradient)" stroke-width="28" stroke-linecap="round" />

          <!-- Central Folding Hinge Mechanism -->
          <rect x="450" y="390" width="30" height="48" rx="6" fill="#c9f36a" stroke="#0f172a" stroke-width="3" />
          <circle cx="465" cy="402" r="5" fill="#0f172a" />
          <circle cx="465" cy="426" r="5" fill="#0f172a" />
          <path d="M 470 414 L 495 405" stroke="#0f172a" stroke-width="6" stroke-linecap="round" />
          <circle cx="495" cy="405" r="4" fill="#ff8c75" />
        </g>

        <!-- 5. RIGID FORK -->
        <g
          class="part-interactive part--fork"
          :class="{ 'part--active': isPartHighlighted(['fork']) }"
          role="button"
          tabindex="0"
          aria-label="Front Fork"
          @click="handlePartClick('fork')"
          @mouseenter="handlePartHover('fork')"
        >
          <path d="M 335 340 L 325 390" stroke="url(#frameGradient)" stroke-width="26" stroke-linecap="round" />
          <path d="M 325 390 Q 305 460, 270 520" fill="none" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
          <circle cx="270" cy="520" r="10" fill="#c9f36a" stroke="#0f172a" stroke-width="2.5" />
        </g>

        <!-- 6. TELESCOPIC HANDLEPOST & COCKPIT -->
        <g
          class="part-interactive part--cockpit"
          :class="{ 'part--active': isPartHighlighted(['handlebar', 'stem']) }"
          role="button"
          tabindex="0"
          aria-label="Folding Handlebar & Stem"
          @click="handlePartClick('handlebar', 'stem')"
          @mouseenter="handlePartHover('handlebar', 'stem')"
        >
          <path d="M 335 340 L 290 190" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
          <rect x="302" y="270" width="22" height="14" rx="3" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <path d="M 324 277 L 335 272" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
          <path d="M 260 185 L 320 185" stroke="#0f172a" stroke-width="16" stroke-linecap="round" />
          <rect x="250" y="178" width="24" height="14" rx="3" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <path d="M 270 190 L 260 205" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
        </g>

        <!-- 7. LONG SEATPOST & SADDLE -->
        <g
          class="part-interactive part--seat"
          :class="{ 'part--active': isPartHighlighted(['saddle', 'seatpost']) }"
          role="button"
          tabindex="0"
          aria-label="Long Seatpost & Saddle"
          @click="handlePartClick('saddle', 'seatpost')"
          @mouseenter="handlePartHover('saddle', 'seatpost')"
        >
          <path d="M 590 420 L 635 210" stroke="#334155" stroke-width="22" stroke-linecap="round" />
          <rect x="580" y="410" width="26" height="14" rx="3" fill="#c9f36a" stroke="#0f172a" stroke-width="2" />
          <path d="M 606 417 L 618 412" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />
          <path d="M 585 198 C 625 188, 665 188, 680 205 C 670 215, 640 210, 620 205 Z" fill="#0f172a" stroke="#c9f36a" stroke-width="2" />
          <path d="M 610 200 C 630 195, 650 195, 665 204" fill="none" stroke="#38bdf8" stroke-width="3" />
        </g>
      </g>

      <!-- ============================================================== -->
      <!-- TYPE C: ROAD & GRAVEL BIKE (Aero Diamond Frame, Drop Bars) -->
      <!-- ============================================================== -->
      <g v-else class="bike-layer road-geometry">
        <!-- Rear Wheel & Tire -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="700c Rear Wheel"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <circle cx="800" cy="480" r="140" fill="none" stroke="url(#tireTreadGrad)" stroke-width="18" />
          <circle cx="800" cy="480" r="131" fill="none" stroke="#334155" stroke-width="16" />
          <path d="M 720 400 A 131 131 0 0 1 760 365" fill="none" stroke="#8eddf4" stroke-width="4" />
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`rw-${deg}`"
              :x1="800 + 15 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 15 * Math.sin(deg * Math.PI / 180)"
              :x2="800 + 131 * Math.cos(deg * Math.PI / 180)"
              :y2="480 + 131 * Math.sin(deg * Math.PI / 180)"
            />
          </g>
          <circle cx="800" cy="480" r="20" fill="#1e293b" stroke="#0f172a" stroke-width="3" />
        </g>

        <!-- Front Wheel & Tire -->
        <g
          class="part-interactive part--wheel"
          :class="{ 'part--active': isPartHighlighted(['tire', 'wheel']) }"
          role="button"
          tabindex="0"
          aria-label="700c Front Wheel"
          @click="handlePartClick('tire', 'wheel')"
          @mouseenter="handlePartHover('tire', 'wheel')"
        >
          <circle cx="240" cy="480" r="140" fill="none" stroke="url(#tireTreadGrad)" stroke-width="18" />
          <circle cx="240" cy="480" r="131" fill="none" stroke="#334155" stroke-width="16" />
          <path d="M 160 400 A 131 131 0 0 1 200 365" fill="none" stroke="#8eddf4" stroke-width="4" />
          <g stroke="#64748b" stroke-width="1.2" opacity="0.65">
            <line
v-for="deg in [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]" :key="`rfw-${deg}`"
              :x1="240 + 15 * Math.cos(deg * Math.PI / 180)"
              :y1="480 + 15 * Math.sin(deg * Math.PI / 180)"
              :x2="240 + 131 * Math.cos(deg * Math.PI / 180)"
              :y2="480 + 131 * Math.sin(deg * Math.PI / 180)"
            />
          </g>
          <circle cx="240" cy="480" r="20" fill="#1e293b" stroke="#0f172a" stroke-width="3" />
        </g>

        <!-- Disc Brakes -->
        <g
          class="part-interactive part--brake"
          :class="{ 'part--active': isPartHighlighted(['brake']) }"
          role="button"
          tabindex="0"
          aria-label="Flat Mount Disc Brakes"
          @click="handlePartClick('brake')"
          @mouseenter="handlePartHover('brake')"
        >
          <circle cx="240" cy="480" r="42" fill="none" stroke="url(#rotorGrad)" stroke-width="8" />
          <rect x="208" y="445" width="18" height="28" rx="3" fill="#0f172a" stroke="#8eddf4" stroke-width="2" />
          <circle cx="800" cy="480" r="42" fill="none" stroke="url(#rotorGrad)" stroke-width="8" />
          <rect x="770" y="450" width="18" height="28" rx="3" fill="#0f172a" stroke="#8eddf4" stroke-width="2" />
        </g>

        <!-- Crankset & Rear Derailleur -->
        <g
          class="part-interactive part--crank"
          :class="{ 'part--active': isPartHighlighted(['crank', 'cassette', 'rear_derailleur']) }"
          role="button"
          tabindex="0"
          aria-label="Road Drivetrain"
          @click="handlePartClick('crank', 'cassette')"
          @mouseenter="handlePartHover('crank', 'cassette')"
        >
          <circle cx="510" cy="480" r="46" fill="none" stroke="#0f172a" stroke-width="6" />
          <circle cx="510" cy="480" r="36" fill="#1e293b" stroke="#64748b" stroke-width="2" />
          <path d="M 510 480 L 460 545" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
          <rect x="445" y="540" width="28" height="10" rx="2" fill="#334155" stroke="#8eddf4" stroke-width="1.5" />
          <circle cx="800" cy="480" r="42" fill="none" stroke="#64748b" stroke-width="3" stroke-dasharray="3 3" />
          <circle cx="800" cy="480" r="22" fill="none" stroke="#e2e8f0" stroke-width="2" />
          <path d="M 800 480 L 825 500 L 835 530" stroke="#0f172a" stroke-width="7" stroke-linecap="round" />
          <path d="M 510 495 L 800 460 M 835 530 L 510 505" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="4 2" />
        </g>

        <!-- Frame -->
        <g
          class="part-interactive part--frame"
          :class="{ 'part--active': isPartHighlighted(['frame']) }"
          role="button"
          tabindex="0"
          aria-label="Aero Road Frame"
          @click="handlePartClick('frame')"
          @mouseenter="handlePartHover('frame')"
        >
          <path d="M 315 240 L 305 285" stroke="url(#frameGradient)" stroke-width="26" stroke-linecap="round" />
          <path d="M 308 275 L 505 475" stroke="url(#frameGradient)" stroke-width="30" stroke-linecap="round" />
          <path d="M 315 245 L 610 260" stroke="url(#frameGradient)" stroke-width="24" stroke-linecap="round" />
          <path d="M 610 255 L 510 480" stroke="url(#frameGradient)" stroke-width="26" stroke-linecap="round" />
          <path d="M 610 265 L 800 480" stroke="url(#frameGradient)" stroke-width="16" stroke-linecap="round" />
          <path d="M 510 480 L 800 480" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
        </g>

        <!-- Fork -->
        <g
          class="part-interactive part--fork"
          :class="{ 'part--active': isPartHighlighted(['fork']) }"
          role="button"
          tabindex="0"
          aria-label="Aero Carbon Fork"
          @click="handlePartClick('fork')"
          @mouseenter="handlePartHover('fork')"
        >
          <path d="M 305 285 L 240 480" stroke="url(#frameGradient)" stroke-width="20" stroke-linecap="round" />
          <circle cx="240" cy="480" r="10" fill="#8eddf4" stroke="#0f172a" stroke-width="2.5" />
        </g>

        <!-- Seat & Post -->
        <g
          class="part-interactive part--seat"
          :class="{ 'part--active': isPartHighlighted(['saddle', 'seatpost']) }"
          role="button"
          tabindex="0"
          aria-label="Aero Seatpost & Saddle"
          @click="handlePartClick('saddle', 'seatpost')"
          @mouseenter="handlePartHover('saddle', 'seatpost')"
        >
          <path d="M 610 260 L 635 190" stroke="#0f172a" stroke-width="20" stroke-linecap="round" />
          <path d="M 595 180 C 630 170, 665 170, 680 190 C 670 198, 640 195, 620 190 Z" fill="#0f172a" stroke="#8eddf4" stroke-width="2" />
        </g>

        <!-- Drop Handlebars & STI Hoods -->
        <g
          class="part-interactive part--cockpit"
          :class="{ 'part--active': isPartHighlighted(['handlebar', 'stem']) }"
          role="button"
          tabindex="0"
          aria-label="Drop Handlebars & Cockpit"
          @click="handlePartClick('handlebar', 'stem')"
          @mouseenter="handlePartHover('handlebar', 'stem')"
        >
          <path d="M 315 225 L 275 210" stroke="#0f172a" stroke-width="18" stroke-linecap="round" />
          <path d="M 275 210 C 245 205, 235 235, 255 260 C 270 275, 290 270, 290 270" fill="none" stroke="#0f172a" stroke-width="14" stroke-linecap="round" />
          <path d="M 245 205 L 235 220 L 235 240" stroke="#8eddf4" stroke-width="7" stroke-linecap="round" />
        </g>
      </g>
    </svg>

    <!-- Floating Interactive Part Information Popover / Tooltip -->
    <transition name="popover-fade">
      <article
        v-if="displayedHotspot"
        class="floating-part-popover"
        :class="popoverPlacement.isTop ? 'floating-part-popover--below' : 'floating-part-popover--above'"
        :style="{
          left: `${popoverPlacement.left}%`,
          top: `${popoverPlacement.top}%`,
        }"
        role="dialog"
        aria-label="Component Quick Info"
      >
        <div class="popover-header">
          <div class="popover-title-row">
            <span class="popover-badge">{{ displayedHotspot.hotspot.beginnerLabel }}</span>
            <button
              v-if="displayedHotspot.isLocked"
              class="popover-close-btn"
              type="button"
              aria-label="Close component preview"
              @click.stop="closePopover"
            >
              ✕
            </button>
          </div>
          <h4 class="popover-part-name">{{ displayedHotspot.hotspot.component.name }}</h4>
        </div>
        <p class="popover-summary">{{ displayedHotspot.hotspot.beginnerSummary }}</p>
        <div class="popover-actions">
          <NuxtLink
            class="popover-link-btn"
            :to="`/learn/components/${displayedHotspot.hotspot.component.slug}`"
          >
            Inspect Guide →
          </NuxtLink>
          <NuxtLink
            class="popover-secondary-link"
            to="/upgrade-lab"
          >
            Check Upgrades
          </NuxtLink>
        </div>
      </article>
    </transition>
  </div>
</template>

<style scoped>
.realistic-diagram-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1000 / 700;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 2px solid rgb(23 32 42 / 12%);
  background:
    radial-gradient(circle at 50% 60%, rgb(201 243 106 / 18%), transparent 65%),
    radial-gradient(circle at 20% 20%, rgb(142 221 244 / 15%), transparent 40%),
    #fffdf7;
  box-shadow: inset 0 2px 8px rgb(23 32 42 / 4%);
  user-select: none;
}

.interactive-hint-bar {
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 85%);
  backdrop-filter: blur(8px);
  border: 1px solid rgb(23 32 42 / 10%);
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--color-asphalt);
  pointer-events: none;
  z-index: 5;
}

.hint-pulse-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgb(34 197 94 / 30%);
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.realistic-bike-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Interactive SVG Component Parts */
.part-interactive {
  cursor: pointer;
  outline: none;
  transition: filter 180ms ease, opacity 180ms ease;
}

.part-interactive:hover {
  filter: drop-shadow(0 0 10px rgb(142 221 244 / 95%));
}

.part-interactive:hover path,
.part-interactive:hover circle,
.part-interactive:hover rect {
  stroke: #8eddf4 !important;
}

.part-interactive.part--active {
  filter: url(#partGlow) !important;
}

.part-interactive.part--active path,
.part-interactive.part--active circle,
.part-interactive.part--active rect {
  stroke: #c9f36a !important;
}

/* Floating Part Popover Tooltip (Desktop/Tablet) */
.floating-part-popover {
  position: absolute;
  width: min(21rem, 90vw);
  padding: 0.95rem 1.15rem;
  border-radius: 1rem;
  border: 2px solid var(--color-ink);
  background: var(--color-white);
  box-shadow: 0 12px 35px rgb(23 32 42 / 24%);
  z-index: 20;
  display: grid;
  gap: 0.45rem;
  pointer-events: auto;
  transition: opacity 150ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.floating-part-popover--below {
  transform: translate(-50%, 8px);
}

.floating-part-popover--above {
  transform: translate(-50%, calc(-100% - 8px));
}

.popover-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.popover-badge {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #166534;
  background: rgb(201 243 106 / 40%);
  padding: 0.2rem 0.55rem;
  border-radius: 0.45rem;
}

.popover-close-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.1rem 0.35rem;
  color: var(--color-asphalt);
  border-radius: 0.35rem;
}

.popover-close-btn:hover {
  background: var(--color-sand);
  color: var(--color-ink);
}

.popover-part-name {
  margin: 0.3rem 0 0;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--color-ink);
}

.popover-summary {
  margin: 0;
  font-size: 0.84rem;
  color: var(--color-asphalt);
  line-height: 1.45;
}

.popover-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.35rem;
}

.popover-link-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 0.6rem;
  background: var(--color-ink);
  color: var(--color-white);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
  transition: transform 120ms ease, background-color 120ms ease;
}

.popover-link-btn:hover {
  background: #2b3a4a;
  transform: translateY(-1px);
}

.popover-secondary-link {
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-asphalt);
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

.popover-secondary-link:hover {
  color: var(--color-ink);
}

/* Transitions */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1), transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 0) scale(0.95);
}

@media (max-width: 48rem) {
  /* On mobile screens, dock cleanly to the bottom inside the diagram card */
  .floating-part-popover {
    position: absolute;
    top: auto !important;
    bottom: 0.65rem !important;
    left: 0.65rem !important;
    right: 0.65rem !important;
    width: auto !important;
    transform: none !important;
    padding: 0.85rem 1rem;
    box-shadow: 0 10px 30px rgb(23 32 42 / 32%);
  }

  .floating-part-popover--below,
  .floating-part-popover--above {
    transform: none !important;
  }

  .popover-fade-enter-from,
  .popover-fade-leave-to {
    opacity: 0;
    transform: translateY(15px) scale(0.97) !important;
  }

  .popover-part-name {
    font-size: 1.05rem;
  }
}
</style>

