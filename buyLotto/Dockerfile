FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Install build tools and upgrade Node.js to 22
RUN apt-get update && apt-get install -y cmake curl xz-utils build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# AWS Lambda Runtime Interface Emulator for local testing
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/local/bin/aws-lambda-rie
RUN chmod +x /usr/local/bin/aws-lambda-rie

ENTRYPOINT ["/usr/bin/npx", "aws-lambda-ric"]
CMD ["/app/index.handler"]
