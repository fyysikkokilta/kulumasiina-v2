# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.mjs file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:24-alpine AS base

ARG SKIP_ENV_VALIDATION=true
ARG NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS=30
ARG NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE=0.25
ARG NEXT_PUBLIC_PRIVACY_POLICY_URL=https://drive.google.com/drive/folders/12VBoHzXG7vEYGul87egYQZ3QN_-CKpBa
ARG NODE_ENV=production

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Set environment variables
ENV SKIP_ENV_VALIDATION=${SKIP_ENV_VALIDATION}
ENV NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS=${NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS}
ENV NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE=${NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE}
ENV NEXT_PUBLIC_PRIVACY_POLICY_URL=${NEXT_PUBLIC_PRIVACY_POLICY_URL}
ENV NODE_ENV=${NODE_ENV}

RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
# Install ghostscript for pdf compression
RUN apk add --no-cache ghostscript

WORKDIR /app

ENV NODE_ENV=${NODE_ENV}
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Remove this line if you do not have this folder
#COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
