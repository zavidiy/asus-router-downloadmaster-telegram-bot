import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {getApiURL, getLoginData, getStatusesText, sendMessage} from './utils';
import {MainApi} from './MainApi/MainApi';
import {ReplyTextType} from './config';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';

dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
    throw new Error('Environment variable "BOT_TOKEN" is not set');
}

const bot = new Telegraf(botToken);
const mainApi = new MainApi(getApiURL());
const authorizedSessionExecutor = new AuthorizedSessionExecutor(mainApi, getLoginData());

bot.command('all', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        sendMessage(ctx, getStatusesText(await mainApi.getTasks()));
    }, ctx)
})

bot.command('active', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        sendMessage(ctx, getStatusesText(await mainApi.getTasks('Downloading', 'notbegin')));
    }, ctx)
})

bot.command('finished', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        sendMessage(ctx, getStatusesText(await mainApi.getTasks('Finished')));
    }, ctx)
})

bot.on(message(), async (ctx) => {
    const {text: message} = ctx;

    if (!message) {
        return;
    }

    authorizedSessionExecutor.addTask(async (ctx) => {
        await mainApi.login(getLoginData());

        await mainApi.addTask({url: message});

        sendMessage(ctx, ReplyTextType.TASK_ADDED);
    }, ctx)
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