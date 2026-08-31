import { describe, expect, it } from 'vitest';
import { generateGpxXml, parseGpxToRoute } from './gpx-export.js';

describe('GPX XML Generator', () => {
  it('generates a valid GPX 1.1 XML string from track points', () => {
    const points = [
      { latitude: -6.2088, longitude: 106.8456, altitude: 25.4, time: '2026-08-30T10:00:00Z' },
      { latitude: -6.2100, longitude: 106.8470, altitude: 28.1, time: '2026-08-30T10:05:00Z' },
    ];

    const xml = generateGpxXml('Morning Sentul Loop', points);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<gpx version="1.1"');
    expect(xml).toContain('<name>Morning Sentul Loop</name>');
    expect(xml).toContain('<trkpt lat="-6.2088000" lon="106.8456000">');
    expect(xml).toContain('<ele>25.4</ele>');
    expect(xml).toContain('<time>2026-08-30T10:00:00Z</time>');
    expect(xml).toContain('<trkpt lat="-6.2100000" lon="106.8470000">');
  });

  it('safely escapes special XML characters in track names', () => {
    const points = [{ latitude: -6.5, longitude: 107.1 }];
    const xml = generateGpxXml('KM 0 & Kopi Daong <Gravel>', points);

    expect(xml).toContain('KM 0 &amp; Kopi Daong &lt;Gravel&gt;');
    expect(xml).not.toContain('& <');
  });
});

describe('GPX Route Parser & SVG Projector', () => {
  it('parses GPX XML and generates normalized SVG path, elevation, distance and waypoints', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Solo Sentul Epic Loop</name></metadata>
  <trk>
    <name>Solo Sentul Epic Loop</name>
    <trkseg>
      <trkpt lat="-6.5500" lon="106.8800"><ele>200.0</ele><time>2026-08-30T06:00:00Z</time></trkpt>
      <trkpt lat="-6.5700" lon="106.9000"><ele>550.0</ele><time>2026-08-30T06:45:00Z</time></trkpt>
      <trkpt lat="-6.5600" lon="106.9200"><ele>320.0</ele><time>2026-08-30T07:30:00Z</time></trkpt>
    </trkseg>
  </trk>
</gpx>`;

    const route = parseGpxToRoute(xml);

    expect(route.name).toBe('Solo Sentul Epic Loop');
    expect(route.distanceKm).toBeGreaterThan(5);
    expect(route.elevationM).toBe(350); // 550 - 200
    expect(route.durationMinutes).toBe(90); // 06:00 to 07:30
    expect(route.pathD).toMatch(/^M \d+ \d+(?: L \d+ \d+)+$/);
    expect(route.waypoints.length).toBe(3);
    expect(route.waypoints[0]?.name).toContain('Start');
    expect(route.waypoints[1]?.name).toContain('Peak (+550m)');
    expect(route.waypoints[2]?.name).toContain('Finish');
  });

  it('throws error if GPX contains fewer than 2 trackpoints', () => {
    const invalidXml = `<gpx><trk><trkseg><trkpt lat="-6.5" lon="106.8"></trkpt></trkseg></trk></gpx>`;
    expect(() => parseGpxToRoute(invalidXml)).toThrow('at least 2 trackpoints');
  });
});
