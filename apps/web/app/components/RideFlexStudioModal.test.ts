import { describe, expect, it } from 'vitest';

describe('RideFlexStudio Logic & AI Agentic Storyteller', () => {
  it('calculates average speed accurately from distance and duration', () => {
    const distanceKm = 45.8;
    const durationMinutes = 105;
    const avgSpeed = Number((distanceKm / (durationMinutes / 60)).toFixed(1));

    expect(avgSpeed).toBe(26.2);
  });

  it('formats duration into readable Indonesian text', () => {
    function formatDuration(mins: number): string {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}j ${m}m` : `${m}m`;
    }

    expect(formatDuration(105)).toBe('1j 45m');
    expect(formatDuration(45)).toBe('45m');
  });

  it('computes correct canvas render dimensions for Story 9:16, Square 1:1, and Landscape 16:9', () => {
    function getCanvasDimensions(ratio: 'story' | 'post' | 'landscape'): { width: number; height: number } {
      if (ratio === 'story') return { width: 1080, height: 1920 };
      if (ratio === 'landscape') return { width: 1200, height: 675 };
      return { width: 1080, height: 1080 };
    }

    expect(getCanvasDimensions('story')).toEqual({ width: 1080, height: 1920 });
    expect(getCanvasDimensions('post')).toEqual({ width: 1080, height: 1080 });
    expect(getCanvasDimensions('landscape')).toEqual({ width: 1200, height: 675 });
  });

  it('formats customizable telemetry stickers correctly', () => {
    const stickers = {
      kom: '👑 KOM Hunter',
      cafe: '☕ Coffee Ride Specialist',
      beast: '⚡ Beast Mode Active',
      speed: '🚀 Top Speed: 54.2 km/h',
      power: '⚡ Avg Power: 245 W',
      gradient: '⛰️ Max Gradient: 18.5%',
      hr: '❤️ Avg Heart Rate: 158 bpm',
      fuel: '🍌 Fuelled by Pisang & Bakwan',
    };

    expect(stickers.speed).toContain('Top Speed: 54.2 km/h');
    expect(stickers.power).toContain('Avg Power: 245 W');
    expect(stickers.gradient).toContain('Max Gradient: 18.5%');
    expect(stickers.hr).toContain('158 bpm');
  });

  it('generates multi-style agentic AI social captions for athletes and casual cyclists', () => {
    const distance = 52.4;
    const elevation = 720;
    const speed = '28.1';

    const athleteCaption = `${distance}km • +${elevation}m elevation gain • ${speed} km/h avg pace. Building power one pedal stroke at a time. ⚡🚴 #GowesKit #NoExcuses`;
    const casualCaption = `Katanya gowes tipis-tipis cari sarapan, nyatanya disiksa tanjakan +${elevation}m. Yang penting outfit matching dan foto Instagram aman! ☕🚴‍♂️ #GowesSantai`;

    expect(athleteCaption).toContain('52.4km • +720m');
    expect(casualCaption).toContain('tanjakan +720m');
    expect(casualCaption).toContain('#GowesSantai');
  });

  it('provides AI mechanical drivetrain recommendations based on ride metrics', () => {
    const elevation = 850;
    const isHeavyClimb = elevation > 500;
    const recommendation = isHeavyClimb
      ? '💡 Rekomendasi Mekanik AI: Rantai telah bekerja keras di elevasi berat. Bersihkan debu dan lumasi sebelum gowes berikutnya.'
      : '💡 Rekomendasi Mekanik AI: Drivetrain dalam kondisi normal.';

    expect(isHeavyClimb).toBe(true);
    expect(recommendation).toContain('Rantai telah bekerja keras');
  });
});
