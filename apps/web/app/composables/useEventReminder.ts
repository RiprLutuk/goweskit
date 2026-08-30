import { getCurrentInstance, onMounted, ref } from 'vue';
import type { NearbyEvent, PublicEvent } from '@goweskit/contracts';
import { useNotify } from './useNotify';

interface EventReminderData {
  id: string;
  title: string;
  startsAt: string;
  description: string;
  meetingArea: string;
  communityName?: string;
}

const REMINDERS_STORAGE_KEY = 'goweskit_ride_reminders_v1';

export function useEventReminder() {
  const { toast } = useNotify();
  const savedReminders = ref<string[]>([]);

  function loadSavedReminders(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(REMINDERS_STORAGE_KEY);
      if (raw) {
        savedReminders.value = JSON.parse(raw);
      }
    } catch {
      savedReminders.value = [];
    }
  }

  if (getCurrentInstance()) {
    onMounted(loadSavedReminders);
  } else {
    loadSavedReminders();
  }

  function isReminderActive(eventId: string): boolean {
    return savedReminders.value.includes(eventId);
  }

  async function toggleReminder(event: NearbyEvent | PublicEvent | EventReminderData): Promise<boolean> {
    const eventId = event.id;
    const exists = isReminderActive(eventId);

    if (exists) {
      savedReminders.value = savedReminders.value.filter((id) => id !== eventId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(savedReminders.value));
      }
      toast.info('Pengingat Dihapus', `Pengingat untuk ${event.title} dinonaktifkan.`);
      return false;
    }

    // Request browser notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }

    savedReminders.value = [...savedReminders.value, eventId];
    if (typeof window !== 'undefined') {
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(savedReminders.value));
    }

    toast.success(
      'Pengingat Diaktifkan! 🔔',
      `Jadwal mabar "${event.title}" telah disimpan. Siapkan sepeda dan perlengkapan Anda!`,
    );
    return true;
  }

  function formatIcsDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function getGoogleCalendarUrl(event: NearbyEvent | PublicEvent | EventReminderData): string {
    const start = new Date(event.startsAt);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3-hour default duration
    const startStr = formatIcsDate(start);
    const endStr = formatIcsDate(end);

    const title = encodeURIComponent(`[GowesKit] ${event.title}`);
    const details = encodeURIComponent(
      `${event.description}\n\n📍 Titik Kumpul: ${event.meetingArea}\n🚴 Komunitas: ${'community' in event ? event.community.name : event.communityName || 'GowesKit'}\n\n🔗 Buka di GowesKit: ${typeof window !== 'undefined' ? window.location.href : 'https://goweskit.com'}`,
    );
    const location = encodeURIComponent(event.meetingArea);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  }

  function downloadIcsFile(event: NearbyEvent | PublicEvent | EventReminderData): void {
    const start = new Date(event.startsAt);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const now = new Date();
    const communityName = 'community' in event ? event.community.name : event.communityName || 'GowesKit';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GowesKit//Ride Events Calendar//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${event.id}@goweskit.com`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:[GowesKit] ${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')} - Penyelenggara: ${communityName}`,
      `LOCATION:${event.meetingArea}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Pengingat Gowes Bareng GowesKit (1 Jam Lagi)',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Pengingat H-1 Gowes Bareng GowesKit - Cek Sepeda & Ban',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `goweskit-mabar-${cleanTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Kalender Disimpan! 📅', 'Buka file .ics di HP atau kalender Anda untuk alarm pengingat otomatis.');
  }

  function getCountdownText(startsAtStr: string): { label: string; isUrgent: boolean; isToday: boolean; isPast: boolean } {
    const target = new Date(startsAtStr).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs <= 0) {
      return { label: 'Selesai', isUrgent: false, isToday: false, isPast: true };
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return {
        label: diffHours <= 1 ? '< 1 Jam' : `${diffHours} Jam Lagi`,
        isUrgent: true,
        isToday: true,
        isPast: false,
      };
    }

    if (diffDays <= 1) {
      return { label: 'Besok', isUrgent: true, isToday: false, isPast: false };
    }

    return { label: `${diffDays} Hari Lagi`, isUrgent: false, isToday: false, isPast: false };
  }

  return {
    savedReminders,
    isReminderActive,
    toggleReminder,
    getGoogleCalendarUrl,
    downloadIcsFile,
    getCountdownText,
  };
}
