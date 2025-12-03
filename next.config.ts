import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  cacheComponents: true,
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'drizzle-orm']
  },
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      }
    ]
  }
}

export default withNextIntl(nextConfig)
