<script setup lang="ts">
import { computed } from 'vue';

export type IconName =
  | 'bike'
  | 'bike-road'
  | 'bike-gravel'
  | 'bike-mtb'
  | 'bike-folding'
  | 'route'
  | 'map'
  | 'community'
  | 'users'
  | 'upgrade'
  | 'bolt'
  | 'garage'
  | 'workshop'
  | 'flex'
  | 'camera'
  | 'radar'
  | 'beacon'
  | 'pin'
  | 'shield'
  | 'safety'
  | 'sos'
  | 'wrench'
  | 'tool'
  | 'shop'
  | 'store'
  | 'coffee'
  | 'cafe'
  | 'water'
  | 'hydrate'
  | 'mountain'
  | 'climb'
  | 'tree'
  | 'trail'
  | 'frame'
  | 'fork'
  | 'rear_shock'
  | 'wheel'
  | 'hub'
  | 'tire'
  | 'cassette'
  | 'chain'
  | 'crank'
  | 'bottom_bracket'
  | 'rear_derailleur'
  | 'shifter'
  | 'disc_brake'
  | 'headset'
  | 'trophy'
  | 'kom'
  | 'flag'
  | 'sun'
  | 'rain'
  | 'cloud'
  | 'wind'
  | 'sparkles'
  | 'search'
  | 'filter'
  | 'plus'
  | 'share'
  | 'bookmark'
  | 'bookmark-filled'
  | 'check'
  | 'close'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'download'
  | 'trash'
  | 'edit'
  | 'settings'
  | 'history'
  | 'calendar'
  | 'bell'
  | 'passport'
  | 'verified'
  | 'palette'
  | 'cadence'
  | 'goweskit-mark';

const props = withDefaults(
  defineProps<{
    name: IconName | string;
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    filled?: boolean;
  }>(),
  {
    size: 20,
    color: 'currentColor',
    strokeWidth: 2,
    filled: false,
  },
);

const pixelSize = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`;
  if (props.size === 'xs') return '14px';
  if (props.size === 'sm') return '16px';
  if (props.size === 'md') return '20px';
  if (props.size === 'lg') return '24px';
  if (props.size === 'xl') return '32px';
  if (props.size === '2xl') return '40px';
  return props.size.endsWith('px') ||
    props.size.endsWith('rem') ||
    props.size.endsWith('em')
    ? props.size
    : `${props.size}px`;
});
</script>

<template>
  <svg
    class="g-icon"
    :class="`g-icon--${name}`"
    viewBox="0 0 24 24"
    :width="pixelSize"
    :height="pixelSize"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- ══════════════════════════════════════════════════════════
         1. CYCLING CORE DISCIPLINE ICONS
         ══════════════════════════════════════════════════════════ -->
    <!-- Bike (General / Road Clean Aero) -->
    <g
      v-if="name === 'bike' || name === 'bike-road'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="5" cy="16.5" r="3.5" />
      <circle cx="19" cy="16.5" r="3.5" />
      <circle cx="12" cy="16.5" r="1.2" />
      <path d="M5 16.5L9.5 9h4.5l5 7.5" />
      <path d="M9.5 9L12 16.5h7" />
      <path d="M9.5 9L8 6.5h3" />
      <path d="M14 9l1.2-2.5h2.3" />
    </g>

    <!-- Bike Gravel (Adventure Frame + Flared Drop Bar) -->
    <g
      v-else-if="name === 'bike-gravel'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="5" cy="16" r="3.8" />
      <circle cx="19" cy="16" r="3.8" />
      <circle cx="12" cy="16" r="1.3" />
      <path d="M5 16L10 8.5h4l5 7.5" />
      <path d="M10 8.5L12 16h7" />
      <path d="M10 8.5L8.2 5.5h3" />
      <path d="M14 8.5l1.5-3h3l1 1.5" />
    </g>

    <!-- Bike MTB (Suspension Stanchions + Flat Riser Bar + Knobby Profile) -->
    <g
      v-else-if="name === 'bike-mtb'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="5" cy="15.5" r="4" stroke-dasharray="1 2.5" />
      <circle cx="19" cy="15.5" r="4" stroke-dasharray="1 2.5" />
      <circle cx="5" cy="15.5" r="3.5" />
      <circle cx="19" cy="15.5" r="3.5" />
      <path d="M5 15.5L10 9.5h3.5l5.5 6" />
      <path d="M10 9.5L12 15.5h7" />
      <path d="M10 9.5L8.5 7h3" />
      <path d="M13.5 9.5l2-3.5h3.5" />
    </g>

    <!-- Bike Folding (Compact Wheels + Hinge Joint Pivot) -->
    <g
      v-else-if="name === 'bike-folding'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="5.5" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <circle cx="12" cy="17" r="1.2" />
      <path d="M5.5 17L12 11h2l4.5 6" />
      <path d="M12 11l-1 6h7.5" />
      <path d="M11 17L9 5h3" />
      <path d="M14 11l2-7h3" />
      <circle cx="12" cy="11" r="1.5" :fill="color" />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         2. NAVIGATION, ROUTE, & EXPLORE ICONS
         ══════════════════════════════════════════════════════════ -->
    <!-- Route (Stylized GPS Ribbon + Elevation Waypoint) -->
    <g
      v-else-if="name === 'route' || name === 'track'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 19c2.5-3 5-3 7-1s4.5 2 7-1" />
      <path d="M4 13c2.5-3 5-3 7-1s4.5 2 7-1" />
      <circle cx="6" cy="6" r="2.5" :fill="filled ? color : 'none'" />
      <circle cx="18" cy="10" r="2.5" :fill="filled ? color : 'none'" />
      <path
        d="M6 8.5v2.5c0 1.5 1 2.5 2.5 2.5h7c1.5 0 2.5-1 2.5-2.5V10"
        stroke-dasharray="2 2"
      />
    </g>

    <!-- Map / Compass -->
    <g
      v-else-if="name === 'map'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </g>

    <!-- Radar / Live Beacon Locator -->
    <g
      v-else-if="name === 'radar' || name === 'beacon'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="2.5" :fill="color" />
      <path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 18.5a6.5 6.5 0 0 1-6.5-6.5" />
      <path d="M12 22a10 10 0 0 1-10-10" />
    </g>

    <!-- Pin / Location -->
    <g
      v-else-if="name === 'pin'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0c0 5-6 10.5-6 10.5Z"
        :fill="filled ? color : 'none'"
      />
      <circle cx="12" cy="10.5" r="2" :fill="filled ? '#17202A' : 'none'" />
    </g>

    <!-- Mountain / Climb / Elevation -->
    <g
      v-else-if="name === 'mountain' || name === 'climb'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 20l7-12 4 6 2-3 5 9H3Z" :fill="filled ? color : 'none'" />
      <path d="M7.5 13l2.5 2.5 3.5-3.5" />
    </g>

    <!-- Trail / Forest Tree -->
    <g
      v-else-if="name === 'tree' || name === 'trail'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 3L6 10h3.5l-4 6h13l-4-6h3.5L12 3Z"
        :fill="filled ? color : 'none'"
      />
      <path d="M12 16v5" />
    </g>

    <!-- Coffee / Cafe Santai Pitstop -->
    <g
      v-else-if="name === 'coffee' || name === 'cafe'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M17 8h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1" />
      <path
        d="M3 8h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"
        :fill="filled ? color : 'none'"
      />
      <path d="M6 2v3" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </g>

    <!-- Water / Bidon Hydration -->
    <g
      v-else-if="name === 'water' || name === 'hydrate'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 2.5s-6 7-6 11.5a6 6 0 0 0 12 0c0-4.5-6-11.5-6-11.5Z"
        :fill="filled ? color : 'none'"
      />
      <path d="M9.5 13.5a3 3 0 0 0 3 3" />
    </g>

    <!-- Shop / Bike Store -->
    <g
      v-else-if="name === 'shop' || name === 'store'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M3 9l2-5h14l2 5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z"
      />
      <path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
      <path d="M9 21v-5h6v5" />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         3. SOCIAL, COMMUNITY, & PELOTONS
         ══════════════════════════════════════════════════════════ -->
    <!-- Community / Peloton Group -->
    <g
      v-else-if="name === 'community' || name === 'users'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <circle cx="17.5" cy="8.5" r="2.5" />
      <path d="M16 19a5 5 0 0 1 5.5-3.5" />
    </g>

    <!-- Trophy / KOM Hunter / Leader -->
    <g
      v-else-if="name === 'trophy' || name === 'kom'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 4h12v6a6 6 0 0 1-12 0V4Z" :fill="filled ? color : 'none'" />
      <path d="M6 7H3a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h2" />
      <path d="M18 7h3a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-2" />
      <path d="M12 16v3" />
      <path d="M8 21h8" />
    </g>

    <!-- Flag / Stage Finish -->
    <g
      v-else-if="name === 'flag'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M4 15s1.5-1.5 4-1.5 4 1.5 6.5 1.5 4.5-1.5 5.5-1.5V4s-1.5 1.5-4 1.5-4-1.5-6.5-1.5S4.5 4 4 4v17"
        :fill="filled ? color : 'none'"
      />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         4. WORKSHOP, ANATOMY, & UPGRADE LAB
         ══════════════════════════════════════════════════════════ -->
    <!-- Upgrade / Bolt / Torque Kinetic -->
    <g
      v-else-if="name === 'upgrade' || name === 'bolt'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon
        points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"
        :fill="filled ? color : 'none'"
      />
    </g>

    <!-- Garage / Workshop Wrench -->
    <g
      v-else-if="
        name === 'garage' ||
        name === 'workshop' ||
        name === 'wrench' ||
        name === 'tool'
      "
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a4.5 4.5 0 0 0 6.4-6.4l-2.4 2.4-2-2 2.4-2.4Z"
        :fill="filled ? color : 'none'"
      />
    </g>

    <!-- Camera / Flex Studio -->
    <g
      v-else-if="name === 'flex' || name === 'camera'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11Z"
        :fill="filled ? color : 'none'"
      />
      <circle cx="12" cy="13" r="4" :fill="filled ? '#17202A' : 'none'" />
    </g>

    <!-- Frame (Diamond Geometry) -->
    <g
      v-else-if="name === 'frame'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon points="4 18 11 5 15 5 20 18" />
      <line x1="11" y1="5" x2="12" y2="18" />
      <line x1="15" y1="5" x2="12" y2="18" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </g>

    <!-- Fork (Suspension Stanchions + Crown) -->
    <g
      v-else-if="name === 'fork'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <path d="M7 6h10" />
      <line x1="8" y1="6" x2="8" y2="22" />
      <line x1="16" y1="6" x2="16" y2="22" />
      <line x1="6" y1="22" x2="18" y2="22" />
      <circle cx="8" cy="14" r="1.5" :fill="color" />
      <circle cx="16" cy="14" r="1.5" :fill="color" />
    </g>

    <!-- Rear Shock (Coil / Air Spring Damper) -->
    <g
      v-else-if="name === 'rear_shock'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="3" r="2" />
      <line x1="12" y1="5" x2="12" y2="8" />
      <path d="M8 8h8v6H8z" />
      <line x1="12" y1="14" x2="12" y2="19" />
      <circle cx="12" cy="21" r="2" />
    </g>

    <!-- Wheel / Rim -->
    <g
      v-else-if="name === 'wheel'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" :fill="color" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
      <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
    </g>

    <!-- Hub / Axle Spline -->
    <g
      v-else-if="name === 'hub'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.8" :fill="color" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="8" stroke-dasharray="2 3" />
    </g>

    <!-- Tire (Knobby Tread) -->
    <g
      v-else-if="name === 'tire'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path
        d="M12 3.5V2M12 22v-1.5M3.5 12H2M22 12h-1.5M6 6L5 5M19 19l-1-1M18 6l1-1M6 18l-1 1"
      />
    </g>

    <!-- Cassette (Stepped Sprocket Spider) -->
    <g
      v-else-if="name === 'cassette'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" stroke-dasharray="3 2" />
      <circle cx="12" cy="12" r="6.5" stroke-dasharray="3 2" />
      <circle cx="12" cy="12" r="4" stroke-dasharray="2 2" />
      <circle cx="12" cy="12" r="2" :fill="color" />
    </g>

    <!-- Chain (Connected Rollers) -->
    <g
      v-else-if="name === 'chain'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="8" width="8" height="8" rx="4" />
      <rect x="13" y="8" width="8" height="8" rx="4" />
      <circle cx="7" cy="12" r="1.5" :fill="color" />
      <circle cx="17" cy="12" r="1.5" :fill="color" />
      <line x1="7" y1="10" x2="17" y2="10" />
      <line x1="7" y1="14" x2="17" y2="14" />
    </g>

    <!-- Crank / Chainring -->
    <g
      v-else-if="name === 'crank'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="9" cy="12" r="7" stroke-dasharray="2 2" />
      <circle cx="9" cy="12" r="2.5" :fill="color" />
      <line x1="9" y1="12" x2="20" y2="7" />
      <circle cx="20" cy="7" r="1.8" />
    </g>

    <!-- Bottom Bracket (Threaded Cup) -->
    <g
      v-else-if="name === 'bottom_bracket'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2.5" :fill="color" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
    </g>

    <!-- Rear Derailleur (Shadow Mech) -->
    <g
      v-else-if="name === 'rear_derailleur'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="8" cy="8" r="2.5" :fill="color" />
      <path d="M8 8l5 4" />
      <circle cx="13" cy="12" r="2" />
      <path d="M13 12l2 6" />
      <circle cx="15" cy="18" r="2" />
    </g>

    <!-- Shifter (Dual Control STI Lever) -->
    <g
      v-else-if="name === 'shifter'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M9 4c2 0 4 1 5 3l3 7c.5 1.5 0 3-1.5 3.5s-3 0-3.5-1.5L9 9V4Z"
        :fill="filled ? color : 'none'"
      />
      <path d="M9 9h5" />
      <path d="M11 13l-2 7" />
    </g>

    <!-- Disc Brake (Perforated Rotor) -->
    <g
      v-else-if="name === 'disc_brake'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="1.5" :fill="color" />
      <circle cx="12" cy="6.5" r="0.8" :fill="color" />
      <circle cx="12" cy="17.5" r="0.8" :fill="color" />
      <circle cx="6.5" cy="12" r="0.8" :fill="color" />
      <circle cx="17.5" cy="12" r="0.8" :fill="color" />
    </g>

    <!-- Headset (Tapered Bearing Cup) -->
    <g
      v-else-if="name === 'headset'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 5h12v3H6z" />
      <path d="M8 8v8h8V8" />
      <path d="M5 16h14v3H5z" />
      <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2" />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         5. SAFETY, SOS, & SECURITY
         ══════════════════════════════════════════════════════════ -->
    <!-- Shield / Safety -->
    <g
      v-else-if="name === 'shield' || name === 'safety'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
        :fill="filled ? color : 'none'"
      />
      <path v-if="filled" d="M9 12l2 2 4-4" stroke="#17202A" />
    </g>

    <!-- SOS Alert -->
    <g
      v-else-if="name === 'sos'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" :fill="filled ? '#FF8C75' : 'none'" />
      <path d="M12 8v5" stroke="#FFFFFF" />
      <circle cx="12" cy="16" r="1" fill="#FFFFFF" />
    </g>

    <!-- Verified Badge -->
    <g
      v-else-if="name === 'verified'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polygon
        points="12 2 15 5 19 4 20 8 23 11 22 15 23 19 19 20 18 24 14 23 12 26 10 23 6 24 5 20 1 19 2 15 1 11 4 8 5 4 9 5 12 2"
        :fill="filled ? color : 'none'"
      />
      <path d="M9 12l2 2 4-4" />
    </g>

    <!-- Passport / Specs ID -->
    <g
      v-else-if="name === 'passport'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        :fill="filled ? color : 'none'"
      />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8 16h8M8 13h5" />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         6. WEATHER ICONS
         ══════════════════════════════════════════════════════════ -->
    <!-- Sun -->
    <g
      v-else-if="name === 'sun'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" :fill="filled ? color : 'none'" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </g>

    <!-- Rain -->
    <g
      v-else-if="name === 'rain'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M19 14.5a4.5 4.5 0 0 0-4-4.4A6 6 0 0 0 4 13a4 4 0 0 0 3 4.5h12Z"
      />
      <line x1="8" y1="19" x2="7" y2="22" />
      <line x1="12" y1="19" x2="11" y2="22" />
      <line x1="16" y1="19" x2="15" y2="22" />
    </g>

    <!-- Cloud -->
    <g
      v-else-if="name === 'cloud'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10Z"
        :fill="filled ? color : 'none'"
      />
    </g>

    <!-- Wind -->
    <g
      v-else-if="name === 'wind'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 19.41A2 2 0 1 0 14 16H2M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"
      />
    </g>

    <!-- Sparkles / Agentic AI -->
    <g
      v-else-if="name === 'sparkles'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z"
        :fill="filled ? color : 'none'"
      />
      <path d="M19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
    </g>

    <!-- ══════════════════════════════════════════════════════════
         7. ESSENTIAL UI UTILITY ICONS
         ══════════════════════════════════════════════════════════ -->
    <!-- Search -->
    <g
      v-else-if="name === 'search'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </g>

    <!-- Filter / Tuning Sliders -->
    <g
      v-else-if="name === 'filter'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2.5" :fill="color" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2.5" :fill="color" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="18" r="2.5" :fill="color" />
    </g>

    <!-- Plus / Add -->
    <g
      v-else-if="name === 'plus'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>

    <!-- Check -->
    <g
      v-else-if="name === 'check'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </g>

    <!-- Close / Cross -->
    <g
      v-else-if="name === 'close'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </g>

    <!-- Share -->
    <g
      v-else-if="name === 'share'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </g>

    <!-- Bookmark / Save -->
    <g
      v-else-if="name === 'bookmark'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        :fill="filled ? color : 'none'"
      />
    </g>
    <g
      v-else-if="name === 'bookmark-filled'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        :fill="color"
      />
    </g>

    <!-- Arrows & Chevrons -->
    <g
      v-else-if="name === 'arrow-right'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </g>
    <g
      v-else-if="name === 'arrow-left'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </g>
    <g
      v-else-if="name === 'chevron-right'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </g>
    <g
      v-else-if="name === 'chevron-left'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </g>
    <g
      v-else-if="name === 'chevron-down'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </g>

    <!-- Download -->
    <g
      v-else-if="name === 'download'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </g>

    <!-- Trash / Delete -->
    <g
      v-else-if="name === 'trash'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      />
    </g>

    <!-- Edit -->
    <g
      v-else-if="name === 'edit'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </g>

    <!-- Settings / Gear -->
    <g
      v-else-if="name === 'settings'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </g>

    <!-- History / Clock -->
    <g
      v-else-if="name === 'history'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </g>

    <!-- Calendar / Date -->
    <g
      v-else-if="name === 'calendar'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </g>

    <!-- Bell / Reminder / Notification -->
    <g
      v-else-if="name === 'bell' || name === 'notification'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      :fill="filled ? color : 'none'"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </g>

    <!-- Palette / Custom Frame Styling -->
    <g
      v-else-if="name === 'palette'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 2C6.49 2 2 6.49 2 12c0 4.41 3.59 8 8 8h1.5a2.5 2.5 0 0 0 2.5-2.5c0-.68-.28-1.3-.73-1.77-.45-.47-.77-1.1-.77-1.73 0-1.38 1.12-2.5 2.5-2.5H17c2.76 0 5-2.24 5-5 0-4.42-4.48-6.5-10-6.5Z"
      />
      <circle cx="7" cy="9.5" r="1.2" :fill="color" />
      <circle cx="11.5" cy="6.5" r="1.2" :fill="color" />
      <circle cx="16.5" cy="8" r="1.2" :fill="color" />
    </g>

    <!-- Cadence / Crank Rotation Sensor -->
    <g
      v-else-if="name === 'cadence'"
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8" stroke-dasharray="3 3" />
      <circle cx="12" cy="12" r="2.5" :fill="color" />
      <path d="M12 12L18 7" />
      <circle cx="18" cy="7" r="1.8" />
      <path d="M7 4.5A9 9 0 0 1 17 4.5" />
      <polyline points="15 2 18 4.5 15 7" />
    </g>

    <!-- Signature GowesKit Cycling Emblem (Kinetic Chainring & Aero Speed Vector) -->
    <g v-else-if="name === 'goweskit-mark'">
      <rect width="24" height="24" rx="7" fill="#0F172A" />
      <path
        d="M17.5 8C15.8 6.6 13.5 6 11.2 6.8C7.5 8.2 5.5 12.2 6.8 16C8 19.8 12.2 21.8 16 20.5C18.8 19.5 20.8 17 21 14"
        stroke="#C9F36A"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M13.5 10.5L18.5 14L13.5 17.5"
        stroke="#38BDF8"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="11.8" cy="14" r="1.6" fill="#FFFFFF" />
    </g>

    <!-- Fallback Bike Wheel Cog -->
    <g
      v-else
      :stroke="color"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" :fill="color" />
    </g>
  </svg>
</template>

<style scoped>
.g-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  overflow: visible;
}
</style>
