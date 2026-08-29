import { describe, expect, it, vi } from 'vitest';
import { useNotify } from './useNotify';

vi.mock('sweetalert2', () => {
  const fireMock = vi.fn().mockResolvedValue({ isConfirmed: true });
  const mixinMock = vi.fn().mockReturnValue({ fire: fireMock });
  return {
    default: {
      fire: fireMock,
      mixin: mixinMock,
    },
  };
});

describe('useNotify', () => {
  it('triggers toast notifications', () => {
    const { toast } = useNotify();
    expect(toast.success('Success message')).toBeDefined();
    expect(toast.error('Error message')).toBeDefined();
    expect(toast.warning('Warning message')).toBeDefined();
    expect(toast.info('Info message')).toBeDefined();
  });

  it('triggers alert dialogs', async () => {
    const { alert } = useNotify();
    expect(alert.success('Title', 'Detail')).toBeDefined();
    expect(alert.error('Title', 'Detail')).toBeDefined();
    expect(alert.warning('Title', 'Detail')).toBeDefined();
    const confirmed = await alert.confirm({
      title: 'Confirm action',
      text: 'Are you sure?',
    });
    expect(confirmed).toBe(true);
  });
});
