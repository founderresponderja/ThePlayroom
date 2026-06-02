import { z } from 'zod';

export const AccountType = z.enum([
  'FEMALE_SINGLE',
  'MALE_SINGLE',
  'COUPLE_MF',
  'COUPLE_MM',
  'COUPLE_FF',
  'SWING_CLUB',
  'SEX_SHOP'
]);

export type AccountType = z.infer<typeof AccountType>;
