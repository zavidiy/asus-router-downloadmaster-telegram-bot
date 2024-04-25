import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {getApiURL, getLoginData, sendErrorMessage, sendMessage} from './utils';
import {MainApi} from './MainApi/MainApi';
import {ReplyTextType} from './config';

dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
    throw new Error('Environment variable "BOT_TOKEN" is not set');
}

const bot = new Telegraf(botToken);

bot.on(message(), async (ctx) => {
    const {text: message} = ctx;

    if (!message) {
        return;
    }

    const {message: {message_id: messageId}} = ctx;

    const mainApi = new MainApi(getApiURL());

    try {
        await mainApi.login(getLoginData());

        await mainApi.addTask({url: message});

        sendMessage(ctx, ReplyTextType.TASK_ADDED, messageId);
    } catch (error: any) {
        sendErrorMessage(ctx, error, messageId);
    } finally {
        try {
            await mainApi.logout();
        } catch (error: any) {
            sendErrorMessage(ctx, error, messageId);
        }
    }
})

if (process.env.ENV === 'dev') {
    bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
} else {
    module.exports.bot = async function (event: any) {
        const message = JSON.parse(event.body);

        await bot.handleUpdate(message);

        return {
            statusCode: 200,
            body: '',
        };
    }
}