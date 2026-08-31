import { describe, expect, it } from 'vitest';
import {
  parseCadence,
  parseCyclingPower,
  parseHeartRate,
  useBluetoothSensors,
} from './useBluetoothSensors.js';

describe('useBluetoothSensors & Parsers', () => {
  describe('parseHeartRate', () => {
    it('parses 8-bit heart rate correctly', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint8(0, 0x00); // 8-bit flag
      view.setUint8(1, 142); // 142 BPM

      expect(parseHeartRate(view)).toBe(142);
    });

    it('parses 16-bit heart rate correctly', () => {
      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, 0x01); // 16-bit flag
      view.setUint16(1, 185, true); // 185 BPM

      expect(parseHeartRate(view)).toBe(185);
    });

    it('returns 0 on empty data', () => {
      const buffer = new ArrayBuffer(1);
      const view = new DataView(buffer);
      expect(parseHeartRate(view)).toBe(0);
    });
  });

  describe('parseCyclingPower', () => {
    it('parses instantaneous power in watts', () => {
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint16(0, 0x00, true); // flags
      view.setInt16(2, 275, true); // 275 Watts

      expect(parseCyclingPower(view)).toBe(275);
    });

    it('returns 0 on truncated buffer', () => {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      expect(parseCyclingPower(view)).toBe(0);
    });
  });

  describe('parseCadence', () => {
    it('returns initial state with zero RPM on first reading', () => {
      const buffer = new ArrayBuffer(5);
      const view = new DataView(buffer);
      view.setUint8(0, 0x02); // Crank data present (bit 1)
      view.setUint16(1, 100, true); // Cumulative Crank Revs
      view.setUint16(3, 10240, true); // Last Event Time

      const result = parseCadence(view, null);
      expect(result).toEqual({
        cadenceRpm: 0,
        revs: 100,
        time: 10240,
      });
    });

    it('calculates 90 RPM cadence accurately from crank deltas', () => {
      // 90 RPM = 1.5 revs per second
      // 3 revs in 2 seconds (2 * 1024 = 2048 time units)
      // (3 * 60 * 1024) / 2048 = 90 RPM
      const prev = { lastRevs: 100, lastTime: 10000 };

      const buffer = new ArrayBuffer(5);
      const view = new DataView(buffer);
      view.setUint8(0, 0x02); // Crank data present
      view.setUint16(1, 103, true); // 103 revs (+3)
      view.setUint16(3, 12048, true); // +2048 time units

      const result = parseCadence(view, prev);
      expect(result).not.toBeNull();
      expect(result?.cadenceRpm).toBe(90);
      expect(result?.revs).toBe(103);
      expect(result?.time).toBe(12048);
    });

    it('handles wheel + crank combined payload correctly with 6-byte wheel offset', () => {
      // Flag: 0x03 (wheel + crank present)
      // Bytes: [Flag:1][WheelRevs:4][WheelTime:2][CrankRevs:2][CrankTime:2]
      const buffer = new ArrayBuffer(11);
      const view = new DataView(buffer);
      view.setUint8(0, 0x03); // Bit 0 & Bit 1 set
      // Wheel data (6 bytes)
      view.setUint32(1, 5000, true);
      view.setUint16(5, 8000, true);
      // Crank data (4 bytes)
      view.setUint16(7, 103, true); // Crank revs
      view.setUint16(9, 12048, true); // Crank time

      const prev = { lastRevs: 100, lastTime: 10000 };
      const result = parseCadence(view, prev);

      expect(result).not.toBeNull();
      expect(result?.cadenceRpm).toBe(90);
    });

    it('returns null if crank data is not present in flags', () => {
      const buffer = new ArrayBuffer(7);
      const view = new DataView(buffer);
      view.setUint8(0, 0x01); // Wheel data only, NO crank data

      expect(parseCadence(view, null)).toBeNull();
    });
  });

  describe('useBluetoothSensors Composable Initial State', () => {
    it('initializes with null metrics and disconnected state', () => {
      const sensors = useBluetoothSensors();
      expect(sensors.heartRate.value).toBeNull();
      expect(sensors.cadenceRpm.value).toBeNull();
      expect(sensors.powerWatts.value).toBeNull();
      expect(sensors.isHrConnected.value).toBe(false);
      expect(sensors.isCscConnected.value).toBe(false);
      expect(sensors.isPowerConnected.value).toBe(false);
    });

    it('gracefully handles disconnection and resets all metrics', () => {
      const sensors = useBluetoothSensors();
      sensors.disconnectAll();
      expect(sensors.heartRate.value).toBeNull();
      expect(sensors.cadenceRpm.value).toBeNull();
      expect(sensors.powerWatts.value).toBeNull();
      expect(sensors.isHrConnected.value).toBe(false);
    });
  });
});
