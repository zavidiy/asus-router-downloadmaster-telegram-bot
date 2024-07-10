# Telegram bot for Asus router download master

## Installation
- Node 18+
- Install dependencies with `npm install`

## Local development
- Setup `.env`;
- Use `npm run dev` command to run in development mode;

## Build
- Use `npm run build` to create an application;

You can use a webhook to send messages to the bot.
```url 
https://api.telegram.org/bot{bot_token}/setWebHook?url={webhook_url}
```

## Deploy in Yandex Cloud

- [Install yc](https://yandex.cloud/ru/docs/cli/quickstart)

- Build docker image
```shell
 docker build . -t cr.yandex/{registry_id}/asus-router-downloadmaster-telegram-bot
```

- Push image to registry
```shell
docker push cr.yandex/{registry_id}/asus-router-downloadmaster-telegram-bot
```

- Check your image in registry
```shell
yc container image list
```