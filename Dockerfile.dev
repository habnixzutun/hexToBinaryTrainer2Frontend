FROM node:20-slim

WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm install

# Quellcode kopieren
COPY . .

# Vite Standard-Port
EXPOSE 5173

# WICHTIG: --host 0.0.0.0 ist nötig, damit der Port aus dem Container
# an deinen Rechner weitergereicht werden kann.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]