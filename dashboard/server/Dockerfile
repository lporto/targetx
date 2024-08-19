# Dockerfile for Node.js Backend

FROM node:latest

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
