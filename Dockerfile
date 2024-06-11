FROM node:18 as builder

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

FROM node:18

WORKDIR /app

COPY --from=builder /app/dist .
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules

ARG BOT_TOKEN
ARG ROUTER_API_URL
ARG USER_NAME
ARG USER_PASSWORD

CMD [ "node", "./index.js" ]