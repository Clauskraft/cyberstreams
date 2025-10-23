FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Ensure log directory exists for cron
RUN mkdir -p /var/log/cyberstreams && \
    npm run build || true

COPY ingestion/crontab /etc/crontabs/root

CMD ["crond", "-f", "-l", "2"]
