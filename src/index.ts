import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {getApiURL, getLoginData} from './utils';
import {MainApi} from './MainApi/MainApi';

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

    const replyParameters = {reply_parameters: {message_id: ctx.message.message_id}};

    try {
        const mainApi = new MainApi(getApiURL());

        await mainApi.login(getLoginData());

        await mainApi.addTask({url: message});

        ctx.reply('Task added', replyParameters);
    } catch (error: any) {
        ctx.reply(error.toString(), replyParameters);
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