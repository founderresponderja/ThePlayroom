import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/(.*)': ['./messages/**/*.json'],
    },
  },
}

const intlConfig = withNextIntl(nextConfig)

export default withSentryConfig(intlConfig, {
  silent: true,
  disableLogger: true,
})
