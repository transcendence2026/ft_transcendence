# --- STAGE 1: build ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma Client for TypeScript
RUN npx prisma generate

COPY src ./src
RUN npm run build

# --- STAGE 2: Production ---
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --only=production

# Generate Prisma Client for the runtime environment
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
