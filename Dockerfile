# 🔨 Build Stage
FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 🚀 Production Stage
FROM alpine:latest
WORKDIR /srv/frontend

COPY --from=builder /app/dist .