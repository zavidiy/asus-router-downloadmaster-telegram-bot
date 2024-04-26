import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {message} from 'telegraf/filters';
import {getApiURL, getLoginData, sendMessage} from './utils';
import {MainApi, TaskStatus} from './MainApi/MainApi';
import {ReplyTextType} from './config';
import dedent from 'ts-dedent';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';

dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
    throw new Error('Environment variable "BOT_TOKEN" is not set');
}

const bot = new Telegraf(botToken);
const mainApi = new MainApi(getApiURL());
const authorizedSessionExecutor = new AuthorizedSessionExecutor(mainApi, getLoginData());

function getStatusesText(statuses: TaskStatus[]) {
    let reply = '';
    const lastIndex = statuses.length - 1;

    statuses.forEach(({name, downloaded, size, status}, index) => {
        reply += dedent(`
            #${index + 1} ${name}
            ${size}
            ${status} ${status === 'Downloading' ? `: ${Number((downloaded * 100).toFixed(2))}%` : ''}
            `);

        if (index !== lastIndex) {
            reply += '\n\n';
        }
    })

    return reply || 'No tasks found';
}

bot.command('all', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        const statuses = await mainApi.getTasks();

        sendMessage(ctx, getStatusesText(statuses));
    }, ctx)
})

bot.command('active', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        const statuses = await mainApi.getTasks('Downloading', 'notbegin');

        sendMessage(ctx, getStatusesText(statuses));
    }, ctx)
})

bot.on(message(), async (ctx) => {
    const {text: message} = ctx;

    if (!message) {
        return;
    }

    const {message: {message_id: messageId}} = ctx;

    authorizedSessionExecutor.addTask(async (ctx) => {
        await mainApi.login(getLoginData());

        await mainApi.addTask({url: message});

        sendMessage(ctx, ReplyTextType.TASK_ADDED, messageId);
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