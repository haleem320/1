# MEXC Futures Bot v34.9.2
FROM node:20-alpine

# Non-root user for safety
RUN addgroup -S bot && adduser -S bot -G bot

WORKDIR /app

# Install dependencies first (better Docker layer caching)
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application code
COPY server.js ./

# Persistent state directory (Railway volume mounts here if configured)
RUN mkdir -p /data && chown -R bot:bot /data /app

ENV NODE_ENV=production
ENV PORT=8080
ENV BOT_STATE_FILE=/data/bot-state-v34.json

USER bot

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1

CMD ["node", "server.js"]
