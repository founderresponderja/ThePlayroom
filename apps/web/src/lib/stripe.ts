import Stripe from 'stripe'

// Must match the apiVersion used in the webhook handler
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  FEMALE_SINGLE: {
    monthly: process.env.STRIPE_PRICE_FEMALE_SINGLE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_FEMALE_SINGLE_ANNUAL!,
  },
  MALE_SINGLE: {
    monthly: process.env.STRIPE_PRICE_MALE_SINGLE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_MALE_SINGLE_ANNUAL!,
  },
  COUPLE_MF: {
    monthly: process.env.STRIPE_PRICE_COUPLE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_COUPLE_ANNUAL!,
  },
  COUPLE_MM: {
    monthly: process.env.STRIPE_PRICE_COUPLE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_COUPLE_ANNUAL!,
  },
  COUPLE_FF: {
    monthly: process.env.STRIPE_PRICE_COUPLE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_COUPLE_ANNUAL!,
  },
  SWING_CLUB: {
    monthly: process.env.STRIPE_PRICE_RESERVATION_MGMT_MONTHLY!,
    annual: process.env.STRIPE_PRICE_RESERVATION_MGMT_ANNUAL!,
  },
  SEX_SHOP: {
    monthly: process.env.STRIPE_PRICE_RESERVATION_MGMT_MONTHLY!,
    annual: process.env.STRIPE_PRICE_RESERVATION_MGMT_ANNUAL!,
  },
}
