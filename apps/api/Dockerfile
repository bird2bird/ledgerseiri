FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client
RUN npx prisma generate

# Build Nest
RUN npm run build

# DEBUG: show dist structure (so we know where main.js is)
RUN echo "===== dist tree =====" && (ls -la dist || true) && (find dist -maxdepth 3 -type f | head -n 50)

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# ✅ run the first main.js found under dist (works for dist/main.js or dist/src/main.js)
CMD ["sh","-lc","node $(find dist -type f -name 'main.js' | head -n 1)"]
