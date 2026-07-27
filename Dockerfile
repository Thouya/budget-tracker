FROM node:20-slim AS web-build
WORKDIR /app/web
COPY web/package.json ./
RUN npm install
COPY web/ ./
RUN npm run build

FROM node:20-slim AS server
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev
COPY server/ ./
COPY --from=web-build /app/web/dist /app/web/dist

ENV NODE_ENV=production
ENV DATA_DIR=/app/server/data
EXPOSE 3000

CMD ["node", "src/index.js"]
