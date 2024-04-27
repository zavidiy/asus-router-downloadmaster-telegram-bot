import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {getApiURL, getLoginData, getStatusesText, isMagnetLink, sendMessage} from './utils';
import {MainApi} from './MainApi/MainApi';
import {ReplyTextType} from './config';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';
import {getFilterByName, getFilterByStatus} from './MainApi/utils';

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
        const tasks = await mainApi.getTasks(getFilterByStatus('Downloading', 'notbegin'));

        sendMessage(ctx, getStatusesText(tasks));
    }, ctx)
})

bot.command('finished', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        sendMessage(ctx, getStatusesText(await mainApi.getTasks(getFilterByStatus('Finished'))));
    }, ctx)
})

bot.on(message(), async (ctx) => {
    const {text: message} = ctx;

    if (!message) {
        return;
    }

    if (isMagnetLink(message)) {
        authorizedSessionExecutor.addTask(async (ctx) => {
            await mainApi.addTask({url: message});

            sendMessage(ctx, ReplyTextType.TASK_ADDED);
        }, ctx)
    } else {
        authorizedSessionExecutor.addTask(async (ctx) => {
            const tasks = await mainApi.getTasks(getFilterByName(message));

            sendMessage(ctx, getStatusesText(tasks));
        }, ctx)
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