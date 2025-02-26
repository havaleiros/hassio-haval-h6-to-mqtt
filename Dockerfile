FROM node:20-alpine

WORKDIR /app

COPY haval-h6-mqtt/ .

RUN npm ci --only=production

CMD ["node", "index.js"]