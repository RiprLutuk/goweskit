export const GPX_MAX_FILE_BYTES = 2_000_000;
export const GPX_MIN_POINTS = 2;
export const GPX_MAX_POINTS = 10_000;

const EARTH_MEAN_RADIUS_METERS = 6_371_008.8;
const GPX_ROOT_PATTERN =
  /<(?:[A-Za-z_][\w.-]*:)?gpx\b[^>]*>[\s\S]*<\/(?:[A-Za-z_][\w.-]*:)?gpx\s*>/iu;
const GPX_POINT_PATTERN =
  /<(?:[A-Za-z_][\w.-]*:)?(?:trkpt|rtept)\b([^<>]*?)(?:\/\s*>|>)/giu;
const UNSAFE_XML_PATTERN = /<!DOCTYPE\b|<!ENTITY\b|<!\[CDATA\[|<!--/iu;
const CUSTOM_ENTITY_REFERENCE_PATTERN =
  /&(?!amp;|lt;|gt;|quot;|apos;)[A-Za-z_:][\w.:-]*;/iu;
const XML_DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/u;

export interface GpxImportResult {
  fileName: string;
  pointCount: number;
  distanceMeters: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export class GpxImportError extends Error {
  public constructor(
    public readonly code:
      | 'GPX_EMPTY'
      | 'GPX_TOO_LARGE'
      | 'GPX_UNSAFE_XML'
      | 'GPX_INVALID_XML'
      | 'GPX_TOO_FEW_POINTS'
      | 'GPX_TOO_MANY_POINTS'
      | 'GPX_INVALID_COORDINATE',
    message: string,
  ) {
    super(message);
    this.name = 'GpxImportError';
  }
}

function coordinateAttribute(attributes: string, name: 'lat' | 'lon'): number {
  const pattern = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(["'])([^"']*)\\1`,
    'giu',
  );
  const matches = [...attributes.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new GpxImportError(
      'GPX_INVALID_COORDINATE',
      `Every GPX point must contain exactly one ${name} attribute.`,
    );
  }
  const raw = matches[0]?.[2] ?? '';
  if (!XML_DECIMAL_PATTERN.test(raw)) {
    throw new GpxImportError(
      'GPX_INVALID_COORDINATE',
      `GPX ${name} must be a finite decimal number.`,
    );
  }
  return Number(raw);
}

function radians(value: number): number {
  return (value * Math.PI) / 180;
}

function segmentDistanceMeters(
  from: readonly [number, number],
  to: readonly [number, number],
): number {
  const longitudeDelta = radians(to[0] - from[0]);
  const latitudeDelta = radians(to[1] - from[1]);
  const fromLatitude = radians(from[1]);
  const toLatitude = radians(to[1]);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    2 *
    EARTH_MEAN_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function parseGpxImport(
  fileName: string,
  content: string,
): GpxImportResult {
  if (content.trim().length === 0) {
    throw new GpxImportError('GPX_EMPTY', 'GPX content is empty.');
  }
  if (Buffer.byteLength(content, 'utf8') > GPX_MAX_FILE_BYTES) {
    throw new GpxImportError(
      'GPX_TOO_LARGE',
      `GPX content exceeds ${String(GPX_MAX_FILE_BYTES)} bytes.`,
    );
  }
  if (
    UNSAFE_XML_PATTERN.test(content) ||
    CUSTOM_ENTITY_REFERENCE_PATTERN.test(content)
  ) {
    throw new GpxImportError(
      'GPX_UNSAFE_XML',
      'GPX DTDs, entities, comments, and CDATA are not accepted.',
    );
  }
  if (!GPX_ROOT_PATTERN.test(content)) {
    throw new GpxImportError(
      'GPX_INVALID_XML',
      'GPX content must contain a complete gpx root element.',
    );
  }

  const coordinates: [number, number][] = [];
  for (const match of content.matchAll(GPX_POINT_PATTERN)) {
    if (coordinates.length === GPX_MAX_POINTS) {
      throw new GpxImportError(
        'GPX_TOO_MANY_POINTS',
        `GPX content exceeds ${String(GPX_MAX_POINTS)} points.`,
      );
    }
    const attributes = match[1] ?? '';
    const latitude = coordinateAttribute(attributes, 'lat');
    const longitude = coordinateAttribute(attributes, 'lon');
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new GpxImportError(
        'GPX_INVALID_COORDINATE',
        'GPX point is outside longitude/latitude bounds.',
      );
    }
    coordinates.push([longitude, latitude]);
  }

  if (coordinates.length < GPX_MIN_POINTS) {
    throw new GpxImportError(
      'GPX_TOO_FEW_POINTS',
      `GPX content requires at least ${String(GPX_MIN_POINTS)} points.`,
    );
  }

  let distanceMeters = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const from = coordinates[index - 1];
    const to = coordinates[index];
    if (from !== undefined && to !== undefined) {
      distanceMeters += segmentDistanceMeters(from, to);
    }
  }

  return {
    fileName,
    pointCount: coordinates.length,
    distanceMeters: Math.round(distanceMeters),
    geometry: { type: 'LineString', coordinates },
  };
}
