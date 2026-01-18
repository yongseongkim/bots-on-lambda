FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Install AWS Lambda Runtime Interface Client
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# AWS Lambda Runtime Interface Emulator for local testing
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/local/bin/aws-lambda-rie
RUN chmod +x /usr/local/bin/aws-lambda-rie

ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]
CMD ["index.handler"]
