FROM ubuntu:22.04 AS builder

RUN apt-get update && \
    apt-get install -y curl cmake build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
# Install only Chromium browser and its system dependencies
RUN npx playwright install --with-deps chromium && \
    chmod -R o+rx /opt/pw-browsers

COPY . .

ENTRYPOINT ["/usr/bin/npx", "aws-lambda-ric"]
CMD ["/app/index.handler"]
