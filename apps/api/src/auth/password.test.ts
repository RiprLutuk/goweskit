import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password without storing it', async () => {
    const encoded = await hashPassword('correct horse battery staple');

    expect(encoded).not.toContain('correct horse battery staple');
    await expect(
      verifyPassword('correct horse battery staple', encoded),
    ).resolves.toBe(true);
    await expect(verifyPassword('wrong password', encoded)).resolves.toBe(
      false,
    );
  });

  it('rejects malformed stored hashes', async () => {
    await expect(verifyPassword('password', 'not-a-valid-hash')).resolves.toBe(
      false,
    );
  });
});
