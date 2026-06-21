FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "echo '[CMD] container started'; node -v; echo '[CMD] listing dist:'; ls -la dist || echo '[CMD] NO dist DIRECTORY'; echo '[CMD] running migrate...'; npx prisma migrate deploy; echo \"[CMD] migrate exit=$?\"; echo '[CMD] launching node...'; node dist/server.js; echo \"[CMD] node EXITED code=$?\""]
