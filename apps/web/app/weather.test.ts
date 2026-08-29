import { describe, expect, it } from 'vitest';

import {
  getCyclingAdvice,
  parseWmoWeather,
} from './composables/useWeather.js';

describe('Weather Interpretation & Cycling Advice', () => {
  it('parses WMO weather codes accurately', () => {
    expect(parseWmoWeather(0)).toEqual({ label: 'Cerah', icon: '☀️' });
    expect(parseWmoWeather(1)).toEqual({ label: 'Cerah Berawan', icon: '🌤️' });
    expect(parseWmoWeather(3)).toEqual({ label: 'Berawan', icon: '☁️' });
    expect(parseWmoWeather(45)).toEqual({ label: 'Berkabut', icon: '🌫️' });
    expect(parseWmoWeather(51)).toEqual({ label: 'Gerimis', icon: '🌦️' });
    expect(parseWmoWeather(61)).toEqual({ label: 'Hujan', icon: '🌧️' });
    expect(parseWmoWeather(80)).toEqual({ label: 'Hujan Deras', icon: '🌧️' });
    expect(parseWmoWeather(95)).toEqual({ label: 'Badai Petir', icon: '⛈️' });
  });

  it('computes contextual cycling advice based on conditions', () => {
    // Normal / Ideal conditions
    expect(getCyclingAdvice(24, 10, 1)).toBe('Cuaca Gowes Ideal');

    // Bad conditions
    expect(getCyclingAdvice(20, 10, 95)).toBe('Waspada Badai Petir');
    expect(getCyclingAdvice(22, 10, 61)).toBe('Jalan Licin & Basah');
    expect(getCyclingAdvice(23, 10, 51)).toBe('Gerimis Tipis');

    // Extreme weather
    expect(getCyclingAdvice(25, 32, 1)).toBe('Angin Kencang');
    expect(getCyclingAdvice(35, 10, 0)).toBe('Suhu Terik, Hidrasi Ekstra');
    expect(getCyclingAdvice(14, 10, 0)).toBe('Suhu Dingin, Siapkan Windbreaker');
  });
});
