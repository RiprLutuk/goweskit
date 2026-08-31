export interface GpxPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null | undefined;
  time?: string | null | undefined;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

/**
 * Generates a valid GPX 1.1 XML string from a list of coordinate points.
 */
export function generateGpxXml(trackName: string, points: GpxPoint[]): string {
  const trkpts = points
    .map((p) => {
      const eleXml =
        p.altitude !== undefined && p.altitude !== null
          ? `\n        <ele>${p.altitude.toFixed(1)}</ele>`
          : '';
      const timeXml = p.time ? `\n        <time>${p.time}</time>` : '';
      return `      <trkpt lat="${p.latitude.toFixed(7)}" lon="${p.longitude.toFixed(7)}">${eleXml}${timeXml}\n      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GowesKit - https://goweskit.id" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(trackName)}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(trackName)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Initiates a browser download of the generated GPX file.
 */
export function downloadGpxFile(fileName: string, gpxContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([gpxContent], {
    type: 'application/gpx+xml;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    fileName.endsWith('.gpx') ? fileName : `${fileName}.gpx`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ParsedGpxRoute {
  name: string;
  distanceKm: number;
  elevationM: number;
  durationMinutes: number;
  pathD: string;
  waypoints: Array<{
    name: string;
    icon: string;
    x: number;
    y: number;
    type: 'coffee' | 'climb' | 'photo' | 'sprint';
  }>;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGpxToRoute(
  gpxXml: string,
  fallbackName = 'Custom Solo Ride',
): ParsedGpxRoute {
  const nameMatch = /<name>(.*?)<\/name>/i.exec(gpxXml);
  const name = nameMatch?.[1] ? nameMatch[1].trim() : fallbackName;

  const trkptRegex =
    /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"(?:[^>]*)>([\s\S]*?)<\/trkpt>/gi;
  const points: Array<{
    lat: number;
    lon: number;
    ele: number | undefined;
    time: string | undefined;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(gpxXml)) !== null) {
    const rawLat = match[1];
    const rawLon = match[2];
    const inner = match[3];

    if (!rawLat || !rawLon || !inner) continue;

    const lat = Number.parseFloat(rawLat);
    const lon = Number.parseFloat(rawLon);

    const eleMatch = /<ele>(.*?)<\/ele>/i.exec(inner);
    const eleStr = eleMatch?.[1];
    const ele = eleStr ? Number.parseFloat(eleStr) : undefined;

    const timeMatch = /<time>(.*?)<\/time>/i.exec(inner);
    const time = timeMatch?.[1] ? timeMatch[1].trim() : undefined;

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      points.push({ lat, lon, ele, time });
    }
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (points.length < 2 || !firstPoint || !lastPoint) {
    throw new Error('GPX file must contain at least 2 trackpoints.');
  }

  let distanceKm = 0;
  let elevationM = 0;
  let maxEle = -Infinity;
  let maxEleIdx = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p) continue;

    if (p.ele !== undefined && p.ele > maxEle) {
      maxEle = p.ele;
      maxEleIdx = i;
    }

    if (i > 0) {
      const prev = points[i - 1];
      if (prev) {
        distanceKm += haversineDistanceKm(prev.lat, prev.lon, p.lat, p.lon);
        if (p.ele !== undefined && prev.ele !== undefined && p.ele > prev.ele) {
          elevationM += p.ele - prev.ele;
        }
      }
    }
  }

  let durationMinutes = Math.max(Math.round((distanceKm / 22) * 60), 15);
  if (firstPoint.time && lastPoint.time) {
    const startMs = new Date(firstPoint.time).getTime();
    const endMs = new Date(lastPoint.time).getTime();
    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs) {
      durationMinutes = Math.round((endMs - startMs) / 60000);
    }
  }

  const maxSvgPoints = 120;
  const step = Math.max(1, Math.floor(points.length / maxSvgPoints));
  const sampledPoints: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i < points.length; i += step) {
    const item = points[i];
    if (item) sampledPoints.push({ lat: item.lat, lon: item.lon });
  }
  const lastSampled = sampledPoints[sampledPoints.length - 1];
  if (
    !lastSampled ||
    (lastSampled.lat !== lastPoint.lat && lastSampled.lon !== lastPoint.lon)
  ) {
    sampledPoints.push({ lat: lastPoint.lat, lon: lastPoint.lon });
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const p of sampledPoints) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }

  const dLat = Math.max(maxLat - minLat, 0.0001);
  const dLon = Math.max(maxLon - minLon, 0.0001);

  const boxW = 400;
  const boxH = 320;
  const pad = 45;
  const availW = boxW - pad * 2;
  const availH = boxH - pad * 2;

  const scale = Math.min(availW / dLon, availH / dLat);
  const renderW = dLon * scale;
  const renderH = dLat * scale;
  const offsetX = pad + (availW - renderW) / 2;
  const offsetY = pad + (availH - renderH) / 2;

  const projectPoint = (lat: number, lon: number): { x: number; y: number } => {
    const x = Math.round(offsetX + (lon - minLon) * scale);
    const y = Math.round(boxH - (offsetY + (lat - minLat) * scale));
    return { x, y };
  };

  const pathCommands: string[] = [];
  for (let i = 0; i < sampledPoints.length; i++) {
    const pt = sampledPoints[i];
    if (!pt) continue;
    const { x, y } = projectPoint(pt.lat, pt.lon);
    if (i === 0) {
      pathCommands.push(`M ${x} ${y}`);
    } else {
      pathCommands.push(`L ${x} ${y}`);
    }
  }

  const pathD = pathCommands.join(' ');

  const peakPoint = points[maxEleIdx] ?? firstPoint;
  const startPt = projectPoint(firstPoint.lat, firstPoint.lon);
  const endPt = projectPoint(lastPoint.lat, lastPoint.lon);
  const peakPt = projectPoint(peakPoint.lat, peakPoint.lon);

  const waypoints = [
    {
      name: 'Start Solo Ride',
      icon: '🚩',
      x: startPt.x,
      y: startPt.y,
      type: 'photo' as const,
    },
    ...(maxEle > -Infinity && maxEleIdx !== 0 && maxEleIdx !== points.length - 1
      ? [
          {
            name: `Peak (+${Math.round(maxEle)}m)`,
            icon: '⛰️',
            x: peakPt.x,
            y: peakPt.y,
            type: 'climb' as const,
          },
        ]
      : []),
    {
      name: 'Finish Solo Ride',
      icon: '🏁',
      x: endPt.x,
      y: endPt.y,
      type: 'sprint' as const,
    },
  ];

  return {
    name,
    distanceKm: Number(distanceKm.toFixed(1)),
    elevationM: Math.round(elevationM),
    durationMinutes,
    pathD,
    waypoints,
  };
}
