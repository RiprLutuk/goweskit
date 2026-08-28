import { describe, expect, it } from 'vitest';

import {
  COMMUNITY_JOIN_MESSAGES,
  EVENT_JOIN_MESSAGES,
  REPUTATION_LEVEL_LABELS,
  formatCommunityDistance,
} from './community-display';

describe('Community display copy', () => {
  it('keeps every join outcome actionable', () => {
    expect(Object.keys(COMMUNITY_JOIN_MESSAGES)).toHaveLength(5);
    expect(EVENT_JOIN_MESSAGES.membership_required).toContain('community');
  });

  it('uses beginner-readable reputation labels', () => {
    expect(REPUTATION_LEVEL_LABELS.trusted_contributor).toBe(
      'Trusted contributor',
    );
  });

  it('formats nearby distances without false precision', () => {
    expect(formatCommunityDistance(620)).toBe('620 m');
    expect(formatCommunityDistance(1640)).toBe('1.6 km');
  });
});
