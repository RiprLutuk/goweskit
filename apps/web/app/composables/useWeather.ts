import { ref } from 'vue';

export interface WeatherCondition {
  temperatureC: number;
  apparentTempC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherLabel: string;
  icon: string;
  cyclingAdvice: string;
  cityName: string;
  loaded: boolean;
}

export function parseWmoWeather(code: number): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: 'Cerah', icon: '☀️' };
    case 1:
    case 2:
      return { label: 'Cerah Berawan', icon: '🌤️' };
    case 3:
      return { label: 'Berawan', icon: '☁️' };
    case 45:
    case 48:
      return { label: 'Berkabut', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Gerimis', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { label: 'Hujan', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { label: 'Hujan Dingin', icon: '🌨️' };
    case 80:
    case 81:
    case 82:
      return { label: 'Hujan Deras', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { label: 'Badai Petir', icon: '⛈️' };
    default:
      return { label: 'Cerah Berawan', icon: '🌤️' };
  }
}

export function getCyclingAdvice(
  temp: number,
  wind: number,
  code: number,
): string {
  if (code >= 95) return 'Waspada Badai Petir';
  if (code >= 61) return 'Jalan Licin & Basah';
  if (code >= 51) return 'Gerimis Tipis';
  if (wind >= 28) return 'Angin Kencang';
  if (temp >= 33) return 'Suhu Terik, Hidrasi Ekstra';
  if (temp <= 16) return 'Suhu Dingin, Siapkan Windbreaker';
  return 'Cuaca Gowes Ideal';
}

const DEFAULT_WEATHER: WeatherCondition = {
  temperatureC: 24,
  apparentTempC: 24,
  humidityPercent: 70,
  windSpeedKmh: 8,
  weatherCode: 1,
  weatherLabel: 'Cerah Berawan',
  icon: '🌤️',
  cyclingAdvice: 'Cuaca Gowes Ideal',
  cityName: 'Bandung',
  loaded: false,
};

const weatherState = ref<WeatherCondition>({ ...DEFAULT_WEATHER });
let lastFetchedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export function useWeather() {
  async function fetchLiveWeather(
    latitude = -6.9175,
    longitude = 107.6191,
    cityName = 'Bandung',
  ): Promise<WeatherCondition> {
    const now = Date.now();
    if (weatherState.value.loaded && now - lastFetchedAt < CACHE_TTL_MS) {
      return weatherState.value;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok)
        throw new Error(`Weather API returned ${response.status}`);

      const data = (await response.json()) as {
        current?: {
          temperature_2m: number;
          apparent_temperature: number;
          relative_humidity_2m: number;
          weather_code: number;
          wind_speed_10m: number;
        };
      };

      if (data.current) {
        const { label, icon } = parseWmoWeather(data.current.weather_code);
        const advice = getCyclingAdvice(
          data.current.temperature_2m,
          data.current.wind_speed_10m,
          data.current.weather_code,
        );

        weatherState.value = {
          temperatureC: Math.round(data.current.temperature_2m),
          apparentTempC: Math.round(data.current.apparent_temperature),
          humidityPercent: Math.round(data.current.relative_humidity_2m),
          windSpeedKmh: Math.round(data.current.wind_speed_10m),
          weatherCode: data.current.weather_code,
          weatherLabel: label,
          icon,
          cyclingAdvice: advice,
          cityName,
          loaded: true,
        };
        lastFetchedAt = now;
      }
    } catch {
      // Graceful fallback to default weather on network error or offline
      weatherState.value = {
        ...DEFAULT_WEATHER,
        cityName,
        loaded: true,
      };
    }

    return weatherState.value;
  }

  return {
    weather: weatherState,
    fetchLiveWeather,
  };
}
