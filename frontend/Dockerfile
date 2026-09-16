FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 5173
<<<<<<< HEAD
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
=======
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
>>>>>>> origin/dev
