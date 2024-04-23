import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {MainApi} from './MainApi/MainApi';

dotenv.config();

async function bootstrap() {
    const botToken = process.env.BOT_TOKEN;

    if (!botToken) {
        throw new Error('Environment variable "BOT_TOKEN" is not set');
    }

    const url = process.env.ROUTER_API_URL;

    if (!url) {
        throw new Error('Environment variable "ROUTER_API_URL" is not set');
    }

    const username = process.env.USER_NAME;

    if (!username) {
        throw new Error('Environment variable "DOWNLOADMASTER_USERNAME" is not set');
    }

    const password = process.env.USER_PASSWORD;

    if (!password) {
        throw new Error('Environment variable "DOWNLOADMASTER_PASSWORD" is not set');
    }

    const mainApi = new MainApi(url);
    const bot = new Telegraf(botToken);

    bot.on(message(), async (ctx) => {
        const {text: message} = ctx;

        if (!message) {
            return;
        }

        const replyParameters = {reply_parameters: {message_id: ctx.message.message_id}};

        try {
            await mainApi.login({
                username: username,
                password: password,
            });

            await mainApi.addTask({url: message});

            ctx.reply('Task added', replyParameters);
        } catch (e: any) {
            ctx.reply(e.toString(), replyParameters);
        }
    })

    bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

bootstrap();