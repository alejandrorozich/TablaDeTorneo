import { describe, expect, it } from 'vitest';
import { parseGoals } from './goals';

describe('parseGoals', () => {
  it.each(['', '   ', '-1', '100', '1.5', '2,5', 'abc', '1e1', '+3', '٣'])(
    'RQ-06.2 rejects "%s"',
    (raw) => {
      expect(parseGoals(raw)).toBeNull();
    },
  );

  it.each([
    ['0', 0],
    ['99', 99],
    [' 7 ', 7],
    ['07', 7],
  ])('RQ-06.3 accepts "%s" as %i', (raw, expected) => {
    expect(parseGoals(raw)).toBe(expected);
  });
});
