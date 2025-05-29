import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import { env } from './src/lib/env'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    reactCompiler: true,
    useCache: true,
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: ['localhost:8010', 'localhost:3000', env.BASE_URL.replace(/^https?:\/\//, '')]
    },
    optimizePackageImports: ['antd', '@ant-design/icons', 'drizzle-orm']
  },
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  serverExternalPackages: ['pdf-to-png-converter'],
  // eslint-disable-next-line @typescript-eslint/require-await
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
      }
    ]
  }
}

export default withNextIntl(nextConfig)
