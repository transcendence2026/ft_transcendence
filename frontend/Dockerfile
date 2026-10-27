# ETAPA 1: Construcción (Vite compila el frontend estático)
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ETAPA 2: Servidor Web Estático (Nginx de producción)
FROM nginx:alpine

# Copiamos la carpeta dist generada en la Etapa 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos la configuración de Nginx con SSL y PWA
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]