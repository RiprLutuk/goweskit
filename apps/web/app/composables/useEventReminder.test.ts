import { describe, expect, it, vi } from 'vitest';
import { useEventReminder } from './useEventReminder';

// Mock useNotify
vi.mock('./useNotify', () => ({
  useNotify: () => ({
    toast: {
      success: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    },
  }),
}));

describe('useEventReminder', () => {
  const dummyEvent = {
    id: '53000000-0000-4000-8000-000000000001',
    slug: 'demo-sunday-loop',
    title: 'Demo Sunday Loop',
    startsAt: '2026-09-06T01:00:00.000Z',
    description: 'Santai pagi keliling kota.',
    meetingArea: 'Karawaci area, Tangerang',
    communityName: 'Karawaci Morning Roll',
  };

  it('generates a valid Google Calendar URL with event parameters', () => {
    const { getGoogleCalendarUrl } = useEventReminder();
    const url = getGoogleCalendarUrl(dummyEvent);

    expect(url).toContain('calendar.google.com');
    expect(url).toContain('TEMPLATE');
    expect(url).toContain(encodeURIComponent('[GowesKit] Demo Sunday Loop'));
    expect(url).toContain(encodeURIComponent('Karawaci area, Tangerang'));
  });

  it('computes concise human-friendly countdown text', () => {
    const { getCountdownText } = useEventReminder();

    const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();
    const result = getCountdownText(futureDate);
    expect(result.label).toBe('3 Hari Lagi');
    expect(result.isPast).toBe(false);

    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const pastResult = getCountdownText(pastDate);
    expect(pastResult.label).toBe('Selesai');
    expect(pastResult.isPast).toBe(true);
  });
});
