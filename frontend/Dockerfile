
# ETAPA 1: Construcción (Build de Vite)

FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ETAPA 2: Servidor Web Estático (Nginx)

FROM nginx:alpine

# Copiamos la carpeta dist generada en la Etapa 1 a la carpeta HTML de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
