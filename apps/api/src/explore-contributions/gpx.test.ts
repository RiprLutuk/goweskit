import { describe, expect, it } from 'vitest';

import {
  GPX_MAX_FILE_BYTES,
  GPX_MAX_POINTS,
  GpxImportError,
  parseGpxImport,
} from './gpx.js';

function gpx(points: string): string {
  return `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>${points}</trkseg></trk></gpx>`;
}

describe('bounded GPX import parser', () => {
  it('returns deterministic longitude/latitude LineString and distance', () => {
    const content = gpx(
      '<trkpt lat="0" lon="0"/><trkpt lon="0" lat="1"></trkpt>',
    );
    const first = parseGpxImport('equator.gpx', content);
    const second = parseGpxImport('equator.gpx', content);
    expect(first).toEqual(second);
    expect(first).toEqual({
      fileName: 'equator.gpx',
      pointCount: 2,
      distanceMeters: 111_195,
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [0, 1],
        ],
      },
    });
  });

  it('accepts namespaced route points in document order', () => {
    const result = parseGpxImport(
      'route.gpx',
      '<g:gpx xmlns:g="urn:gpx"><g:rte><g:rtept lon="107.6" lat="-6.9"/><g:rtept lat="-6.91" lon="107.61"/></g:rte></g:gpx>',
    );
    expect(result.geometry.coordinates).toEqual([
      [107.6, -6.9],
      [107.61, -6.91],
    ]);
  });

  it('rejects DTDs, entity declarations, custom references, comments, and CDATA', () => {
    for (const content of [
      '<!DOCTYPE gpx SYSTEM "file:///etc/passwd"><gpx></gpx>',
      '<!DOCTYPE gpx [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><gpx>&xxe;</gpx>',
      '<gpx>&custom;</gpx>',
      '<gpx><!-- <trkpt lat="0" lon="0"/> --></gpx>',
      '<gpx><![CDATA[<trkpt lat="0" lon="0"/>]]></gpx>',
    ]) {
      expect(() => parseGpxImport('unsafe.gpx', content)).toThrow(
        expect.objectContaining({ code: 'GPX_UNSAFE_XML' }),
      );
    }
  });

  it('enforces UTF-8 byte size before XML processing', () => {
    const oversizedUnicode = `é${'é'.repeat(GPX_MAX_FILE_BYTES / 2)}`;
    expect(oversizedUnicode.length).toBeLessThan(GPX_MAX_FILE_BYTES);
    expect(() => parseGpxImport('large.gpx', oversizedUnicode)).toThrow(
      expect.objectContaining({ code: 'GPX_TOO_LARGE' }),
    );
  });

  it('rejects empty, incomplete, and point-free GPX', () => {
    expect(() => parseGpxImport('empty.gpx', '   ')).toThrow(
      expect.objectContaining({ code: 'GPX_EMPTY' }),
    );
    expect(() => parseGpxImport('broken.gpx', '<gpx><trk>')).toThrow(
      expect.objectContaining({ code: 'GPX_INVALID_XML' }),
    );
    expect(() => parseGpxImport('none.gpx', '<gpx></gpx>')).toThrow(
      expect.objectContaining({ code: 'GPX_TOO_FEW_POINTS' }),
    );
  });

  it('rejects missing, duplicate, non-decimal, and out-of-range coordinates', () => {
    const invalidPoints = [
      '<trkpt lon="107"/><trkpt lat="-6" lon="107"/>',
      '<trkpt lat="-6" lat="-7" lon="107"/><trkpt lat="-6" lon="107"/>',
      '<trkpt lat="NaN" lon="107"/><trkpt lat="-6" lon="107"/>',
      '<trkpt lat="-6" lon="181"/><trkpt lat="-6" lon="107"/>',
      '<trkpt lat="-91" lon="107"/><trkpt lat="-6" lon="107"/>',
    ];
    for (const points of invalidPoints) {
      expect(() => parseGpxImport('invalid.gpx', gpx(points))).toThrow(
        expect.objectContaining({ code: 'GPX_INVALID_COORDINATE' }),
      );
    }
  });

  it('accepts the exact point limit and rejects one point more', () => {
    const atLimit = '<trkpt lat="0" lon="0"/>'.repeat(GPX_MAX_POINTS);
    expect(parseGpxImport('limit.gpx', gpx(atLimit)).pointCount).toBe(
      GPX_MAX_POINTS,
    );
    expect(() =>
      parseGpxImport('too-many.gpx', gpx(`${atLimit}<trkpt lat="0" lon="0"/>`)),
    ).toThrow(expect.objectContaining({ code: 'GPX_TOO_MANY_POINTS' }));
  });

  it('exposes stable parser errors for integration mapping', () => {
    try {
      parseGpxImport('one.gpx', gpx('<trkpt lat="0" lon="0"/>'));
      throw new Error('Expected GPX import to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(GpxImportError);
      expect(error).toMatchObject({ code: 'GPX_TOO_FEW_POINTS' });
    }
  });
});
