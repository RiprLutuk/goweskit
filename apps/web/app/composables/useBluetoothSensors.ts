import { ref } from 'vue';

export interface BluetoothSensorState {
  heartRate: number | null;
  cadenceRpm: number | null;
  powerWatts: number | null;
  hrDeviceName: string | null;
  cscDeviceName: string | null;
  powerDeviceName: string | null;
  isHrConnected: boolean;
  isCscConnected: boolean;
  isPowerConnected: boolean;
  errorMessage: string | null;
}

/**
 * Parses standard Bluetooth SIG Heart Rate Measurement characteristic (0x2A37).
 * Flags byte:
 * - Bit 0: 0 = 8-bit HR value, 1 = 16-bit HR value.
 */
export function parseHeartRate(dataView: DataView): number {
  if (dataView.byteLength < 2) return 0;
  const flags = dataView.getUint8(0);
  const is16Bit = (flags & 0x01) !== 0;
  return is16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

/**
 * Parses standard Bluetooth SIG Cycling Power Measurement characteristic (0x2A63).
 * Bytes 2-3 contain Instantaneous Power in Watts (SINT16, Little Endian).
 */
export function parseCyclingPower(dataView: DataView): number {
  if (dataView.byteLength < 4) return 0;
  return dataView.getInt16(2, true);
}

/**
 * Parses standard Bluetooth SIG Cycling Speed and Cadence (CSC) characteristic (0x2A5B).
 * Flags byte:
 * - Bit 0: Wheel Revolution Data Present (Cumulative Wheel Revs UINT32, Last Wheel Event Time UINT16)
 * - Bit 1: Crank Revolution Data Present (Cumulative Crank Revs UINT16, Last Crank Event Time UINT16)
 */
export function parseCadence(
  dataView: DataView,
  prev: { lastRevs: number; lastTime: number } | null,
): { cadenceRpm: number; revs: number; time: number } | null {
  if (dataView.byteLength < 1) return null;
  const flags = dataView.getUint8(0);
  const hasWheelData = (flags & 0x01) !== 0;
  const hasCrankData = (flags & 0x02) !== 0;

  if (!hasCrankData) return null;

  let offset = 1;
  if (hasWheelData) {
    offset += 6; // 4 bytes wheel revs + 2 bytes wheel time
  }

  if (dataView.byteLength < offset + 4) return null;

  const cumulativeCrankRevs = dataView.getUint16(offset, true);
  const lastCrankEventTime = dataView.getUint16(offset + 2, true); // Unit is 1/1024 s

  if (!prev) {
    return {
      cadenceRpm: 0,
      revs: cumulativeCrankRevs,
      time: lastCrankEventTime,
    };
  }

  // Handle 16-bit rollover
  let revsDiff = cumulativeCrankRevs - prev.lastRevs;
  if (revsDiff < 0) revsDiff += 65536;

  let timeDiff = lastCrankEventTime - prev.lastTime;
  if (timeDiff < 0) timeDiff += 65536;

  if (timeDiff === 0 || revsDiff === 0) {
    return {
      cadenceRpm: 0,
      revs: cumulativeCrankRevs,
      time: lastCrankEventTime,
    };
  }

  // Calculate RPM: (revsDiff * 60 * 1024) / timeDiff
  const cadenceRpm = Math.round((revsDiff * 60 * 1024) / timeDiff);

  return {
    cadenceRpm: Math.min(220, Math.max(0, cadenceRpm)),
    revs: cumulativeCrankRevs,
    time: lastCrankEventTime,
  };
}

export function useBluetoothSensors() {
  const heartRate = ref<number | null>(null);
  const cadenceRpm = ref<number | null>(null);
  const powerWatts = ref<number | null>(null);

  const hrDeviceName = ref<string | null>(null);
  const cscDeviceName = ref<string | null>(null);
  const powerDeviceName = ref<string | null>(null);

  const isHrConnected = ref(false);
  const isCscConnected = ref(false);
  const isPowerConnected = ref(false);
  const errorMessage = ref<string | null>(null);

  let hrDevice: any = null;
  let cscDevice: any = null;
  let powerDevice: any = null;

  let prevCrank: { lastRevs: number; lastTime: number } | null = null;

  function isBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async function connectHeartRate(): Promise<boolean> {
    if (!isBluetoothAvailable()) {
      errorMessage.value =
        'Web Bluetooth API tidak didukung pada browser ini (Gunakan Chrome/Edge/Samsung Internet di Android/Desktop).';
      return false;
    }
    errorMessage.value = null;
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });

      hrDevice = device;
      hrDeviceName.value = device.name || 'Heart Rate Strap';

      device.addEventListener('gattserverdisconnected', () => {
        isHrConnected.value = false;
        heartRate.value = null;
        hrDeviceName.value = null;
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic(
        'heart_rate_measurement',
      );

      await characteristic.startNotifications();
      characteristic.addEventListener(
        'characteristicvaluechanged',
        (e: any) => {
          const value = e.target.value as DataView;
          heartRate.value = parseHeartRate(value);
        },
      );

      isHrConnected.value = true;
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        errorMessage.value = `Gagal menghubungkan sensor detak jantung: ${err.message}`;
      }
      return false;
    }
  }

  async function connectCadence(): Promise<boolean> {
    if (!isBluetoothAvailable()) {
      errorMessage.value =
        'Web Bluetooth API tidak didukung pada browser ini.';
      return false;
    }
    errorMessage.value = null;
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['cycling_speed_and_cadence'] }],
      });

      cscDevice = device;
      cscDeviceName.value = device.name || 'Cadence Sensor';

      device.addEventListener('gattserverdisconnected', () => {
        isCscConnected.value = false;
        cadenceRpm.value = null;
        cscDeviceName.value = null;
        prevCrank = null;
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(
        'cycling_speed_and_cadence',
      );
      const characteristic = await service.getCharacteristic(
        'csc_measurement',
      );

      await characteristic.startNotifications();
      characteristic.addEventListener(
        'characteristicvaluechanged',
        (e: any) => {
          const value = e.target.value as DataView;
          const res = parseCadence(value, prevCrank);
          if (res) {
            cadenceRpm.value = res.cadenceRpm;
            prevCrank = { lastRevs: res.revs, lastTime: res.time };
          }
        },
      );

      isCscConnected.value = true;
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        errorMessage.value = `Gagal menghubungkan sensor kadens: ${err.message}`;
      }
      return false;
    }
  }

  async function connectPower(): Promise<boolean> {
    if (!isBluetoothAvailable()) {
      errorMessage.value =
        'Web Bluetooth API tidak didukung pada browser ini.';
      return false;
    }
    errorMessage.value = null;
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['cycling_power'] }],
      });

      powerDevice = device;
      powerDeviceName.value = device.name || 'Power Meter';

      device.addEventListener('gattserverdisconnected', () => {
        isPowerConnected.value = false;
        powerWatts.value = null;
        powerDeviceName.value = null;
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('cycling_power');
      const characteristic = await service.getCharacteristic(
        'cycling_power_measurement',
      );

      await characteristic.startNotifications();
      characteristic.addEventListener(
        'characteristicvaluechanged',
        (e: any) => {
          const value = e.target.value as DataView;
          powerWatts.value = parseCyclingPower(value);
        },
      );

      isPowerConnected.value = true;
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        errorMessage.value = `Gagal menghubungkan power meter: ${err.message}`;
      }
      return false;
    }
  }

  function disconnectAll(): void {
    if (hrDevice && hrDevice.gatt?.connected) {
      hrDevice.gatt.disconnect();
    }
    if (cscDevice && cscDevice.gatt?.connected) {
      cscDevice.gatt.disconnect();
    }
    if (powerDevice && powerDevice.gatt?.connected) {
      powerDevice.gatt.disconnect();
    }
    isHrConnected.value = false;
    isCscConnected.value = false;
    isPowerConnected.value = false;
    heartRate.value = null;
    cadenceRpm.value = null;
    powerWatts.value = null;
    prevCrank = null;
  }

  return {
    heartRate,
    cadenceRpm,
    powerWatts,
    hrDeviceName,
    cscDeviceName,
    powerDeviceName,
    isHrConnected,
    isCscConnected,
    isPowerConnected,
    errorMessage,
    isBluetoothAvailable,
    connectHeartRate,
    connectCadence,
    connectPower,
    disconnectAll,
  };
}
