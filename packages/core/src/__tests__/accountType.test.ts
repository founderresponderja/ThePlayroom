import { describe, expect, test } from 'vitest';
import { AccountType } from '../types/accountType';

describe('AccountType schema', () => {
  test('accepts valid account types', () => {
    expect(AccountType.parse('FEMALE_SINGLE')).toBe('FEMALE_SINGLE');
    expect(AccountType.parse('SEX_SHOP')).toBe('SEX_SHOP');
  });

  test('rejects invalid account types', () => {
    expect(() => AccountType.parse('UNKNOWN')).toThrow();
  });
});
