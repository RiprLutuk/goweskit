import { computed, ref } from 'vue';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export type GpsStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const DEFAULT_COORDS: UserLocation = {
  latitude: -6.9175,
  longitude: 107.6191,
};

const userCoords = ref<UserLocation>({ ...DEFAULT_COORDS });
const cityName = ref<string>('Bandung');
const isLiveGps = ref<boolean>(false);
const gpsStatus = ref<GpsStatus>('idle');
const bannerDismissed = ref<boolean>(false);

if (import.meta.client && typeof navigator !== 'undefined') {
  if (!('geolocation' in navigator)) {
    gpsStatus.value = 'unavailable';
  } else if ('permissions' in navigator) {
    try {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        if (status.state === 'granted') {
          gpsStatus.value = 'granted';
        } else if (status.state === 'denied') {
          gpsStatus.value = 'denied';
        }
        status.onchange = () => {
          if (status.state === 'granted') {
            gpsStatus.value = 'granted';
          } else if (status.state === 'denied') {
            gpsStatus.value = 'denied';
            isLiveGps.value = false;
          }
        };
      }).catch(() => {
        // Permissions query not supported for geolocation on some engines
      });
    } catch {
      // Ignored
    }
  }
}

export async function reverseGeocodeCity(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`;
    const response = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) throw new Error('Geocoding service unavailable');
    const data = (await response.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };
    return data.city || data.locality || data.principalSubdivision || 'Lokasimu';
  } catch {
    return 'Lokasimu';
  }
}

export function useUserLocation() {
  const showPromptBanner = computed(() => {
    if (!import.meta.client) return false;
    if (isLiveGps.value || bannerDismissed.value) return false;
    return gpsStatus.value !== 'granted';
  });

  function dismissPromptBanner(): void {
    bannerDismissed.value = true;
  }

  async function requestLocation(force = false): Promise<UserLocation> {
    if (!import.meta.client) return userCoords.value;
    if (isLiveGps.value && !force) return userCoords.value;

    if (!('geolocation' in navigator)) {
      gpsStatus.value = 'unavailable';
      return userCoords.value;
    }

    gpsStatus.value = 'requesting';

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          userCoords.value = { latitude: lat, longitude: lon };
          isLiveGps.value = true;
          gpsStatus.value = 'granted';
          bannerDismissed.value = true;

          // Reverse geocode city in background
          try {
            const detectedCity = await reverseGeocodeCity(lat, lon);
            cityName.value = detectedCity;
          } catch {
            cityName.value = 'Lokasimu';
          }

          resolve(userCoords.value);
        },
        () => {
          gpsStatus.value = 'denied';
          // Fallback to default coordinates
          resolve(userCoords.value);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        },
      );
    });
  }

  return {
    coords: userCoords,
    cityName,
    isLiveGps,
    gpsStatus,
    showPromptBanner,
    dismissPromptBanner,
    requestLocation,
  };
}
