# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js ./

# Persist data
VOLUME /app/data
ENV DATA_DIR=/app/data
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server.js"]
