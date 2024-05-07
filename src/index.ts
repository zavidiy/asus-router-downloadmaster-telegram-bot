import * as dotenv from 'dotenv';
import {Markup, Telegraf} from 'telegraf';
import {getApiURL, getLoginData, getTaskInfoText, getTasksInfoText, sendErrorMessage, sendMessage} from './utils';
import {MainApi} from './MainApi/MainApi';
import {
    MAGNET_LINK_COMMAND_REG_EXP,
    TASK_DETAILS_COMMAND_REG_EXP,
    TASK_REMOVE_COMMAND_PREFIX,
    TASK_REMOVE_COMMAND_REG_EXP
} from './config';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';
import {getFilterById, getFilterByName, getFilterByStatus} from './MainApi/utils';
import {ReplyTextType} from './types';
import {message} from 'telegraf/filters';

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
        sendMessage(ctx, getTasksInfoText(await mainApi.getTasksInfo()));
    }, ctx)
})

bot.command('active', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        const tasks = await mainApi.getTasksInfo(getFilterByStatus('Downloading', 'notbegin'));

        sendMessage(ctx, getTasksInfoText(tasks));
    }, ctx)
})

bot.command('finished', async (ctx) => {
    authorizedSessionExecutor.addTask(async (ctx) => {
        sendMessage(ctx, getTasksInfoText(await mainApi.getTasksInfo(getFilterByStatus('Finished'))));
    }, ctx)
})

bot.hears(MAGNET_LINK_COMMAND_REG_EXP, async (ctx) => {
    const url = ctx.match[1];

    authorizedSessionExecutor.addTask(async (ctx) => {
        await mainApi.addTask({url: url});

        sendMessage(ctx, ReplyTextType.TASK_ADDED);
    }, ctx)
});

bot.hears(TASK_DETAILS_COMMAND_REG_EXP, async (ctx) => {
    const id = ctx.match[1];

    authorizedSessionExecutor.addTask(async (ctx) => {
        const taskInfos = await mainApi.getTasksInfo(getFilterById(id));

        const taskInfo = taskInfos.at(-1);

        if (taskInfo === undefined) {
            sendErrorMessage(ctx, `Could not find task with id: ${id}`);

            return;
        }

        const taskInfoText = getTaskInfoText(taskInfo, false);

        sendMessage(ctx, taskInfoText, {
            ...Markup.inlineKeyboard([
                Markup.button.callback('Remove task', `${TASK_REMOVE_COMMAND_PREFIX}${id}`),
            ])
        });
    }, ctx)
});

bot.action(TASK_REMOVE_COMMAND_REG_EXP, (ctx) => {
        const id = ctx.match[1];

        authorizedSessionExecutor.addTask(async (ctx) => {
            await mainApi.removeTask(id);

            sendMessage(ctx, ReplyTextType.TASK_REMOVED);
        }, ctx);
    }
)

bot.on(message(), async (ctx) => {
    const {text: message} = ctx;

    if (!message) {
        sendErrorMessage(ctx, 'Message is empty');

        return;
    }

    authorizedSessionExecutor.addTask(async (ctx) => {
        const tasks = await mainApi.getTasksInfo(getFilterByName(message));

        sendMessage(ctx, getTasksInfoText(tasks));
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