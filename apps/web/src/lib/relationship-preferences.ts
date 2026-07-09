export type LookingForOption =
  | 'SINGLE_M'
  | 'SINGLE_F'
  | 'COUPLE_MF'
  | 'COUPLE_MM'
  | 'COUPLE_FF'

export type SexualOrientationOption =
  | 'HETERO'
  | 'GAY'
  | 'LESBIAN'
  | 'BISEXUAL'
  | 'PANSEXUAL'
  | 'QUEER'
  | 'ASEXUAL'
  | 'QUESTIONING'

export const LOOKING_FOR_OPTIONS: Array<{ value: LookingForOption; label: string }> = [
  { value: 'SINGLE_M', label: 'Single M' },
  { value: 'SINGLE_F', label: 'Single F' },
  { value: 'COUPLE_MF', label: 'Casal MF' },
  { value: 'COUPLE_MM', label: 'Casal MM' },
  { value: 'COUPLE_FF', label: 'Casal FF' },
]

export const ORIENTATION_OPTIONS: Array<{ value: SexualOrientationOption; label: string }> = [
  { value: 'HETERO', label: 'Hetero' },
  { value: 'GAY', label: 'Gay' },
  { value: 'LESBIAN', label: 'Lésbica' },
  { value: 'BISEXUAL', label: 'Bissexual' },
  { value: 'PANSEXUAL', label: 'Pansexual' },
  { value: 'QUEER', label: 'Queer' },
  { value: 'ASEXUAL', label: 'Assexual' },
  { value: 'QUESTIONING', label: 'A explorar' },
]

export function isCoupleAccount(accountType: string | null | undefined) {
  return Boolean(accountType && accountType.startsWith('COUPLE_'))
}

export function isSingleAccount(accountType: string | null | undefined) {
  return accountType === 'FEMALE_SINGLE' || accountType === 'MALE_SINGLE'
}

export function isDatingAccount(accountType: string | null | undefined) {
  return isSingleAccount(accountType) || isCoupleAccount(accountType)
}
