FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
