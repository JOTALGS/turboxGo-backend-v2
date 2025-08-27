# Multi-stage build for TypeScript
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Copy source code (including generated folder if it exists)
COPY src ./src

# Generate Prisma Client (this will respect the output path in schema.prisma)
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies + tsconfig-paths for path resolution
RUN npm ci --only=production && \
    npm install tsconfig-paths && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# IMPORTANT: Copy the generated Prisma client from the custom location
# If your schema.prisma has output = "./src/generated/prisma"
COPY --from=builder /usr/src/app/src/generated ./src/generated

# Also copy the standard Prisma client locations (if needed)
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy tsconfig.json for tsconfig-paths runtime resolution
COPY tsconfig.json ./

# Copy Prisma schema (might be needed for migrations in production)
COPY prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 5000

# Health check with correct port
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#  CMD node -e "const http=require('http');http.get('http://localhost:5000/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Use dumb-init to handle signals properly
# ENTRYPOINT ["dumb-init", "--"]

# Start the application with tsconfig-paths for path alias resolution
CMD ["node", "-r", "tsconfig-paths/register", "dist/app.js"]