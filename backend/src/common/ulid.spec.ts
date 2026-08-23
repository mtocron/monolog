import { createUlid, isUlid } from './ulid';

describe('ULID', () => {
  it('creates a valid 26-character ULID', () => {
    const value = createUlid(1724450000000);
    expect(value).toHaveLength(26);
    expect(isUlid(value)).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isUlid('not-a-ulid')).toBe(false);
  });
});
