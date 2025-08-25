########## base image ##########
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs --shell /bin/sh nodejs

########## dependencies stage ##########
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --ignore-scripts && \
  pnpm store prune

########## build stage ##########
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files and config
COPY package.json pnpm-lock.yaml* ./
COPY tsconfig.json tsup.config.json ./
COPY src ./src

# Build the application using the build script from package.json
RUN pnpm run build

########## production dependencies ##########
FROM base AS prod-deps

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
  pnpm store prune

########## runtime stage ##########
FROM node:22-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs --shell /bin/sh nodejs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV MCP_HTTP_HOST=0.0.0.0
ENV MCP_HTTP_PORT=3000
ENV PORT=3000

# Copy production dependencies
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json for the start script
COPY --chown=nodejs:nodejs package.json ./

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly and run the start command from package.json
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
