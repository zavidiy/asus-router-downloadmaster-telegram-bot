import {Context, Markup, Telegraf} from 'telegraf';
import {MainApi} from '../MainApi/MainApi';
import {AuthorizedSessionExecutor, AuthorizedSessionTask} from '../AuthorizedSessionExecutor';
import {
    getTaskInfoText,
    getTasksInfoText,
    getTorrentNameFromUrlAsync,
    retryAttempt,
    sendErrorMessage,
    sendMessage
} from '../utils';
import {getFilterById, getFilterByName, getFilterByStatus} from '../MainApi/utils';
import {
    MAGNET_LINK_COMMAND_REG_EXP,
    TASK_DETAILS_COMMAND_REG_EXP,
    TASK_REMOVE_COMMAND_PREFIX,
    TASK_REMOVE_COMMAND_REG_EXP
} from '../config';
import {ReplyTextType} from '../types';
import {message} from 'telegraf/filters';
import {ApplicationConfig} from './types';

export class Application {
    private readonly _delayBetweenAttemptsToCheckTaskResult: number;
    private readonly _maxAttemptsToCheckTaskResultCount: number;

    constructor(
        private readonly _mainApi: MainApi,
        private readonly _authorizedSessionExecutor: AuthorizedSessionExecutor,
        {
            delayBetweenAttemptsToCheckTaskResult,
            maxAttemptsToCheckTaskResultCount
        }: ApplicationConfig) {
        this._delayBetweenAttemptsToCheckTaskResult = delayBetweenAttemptsToCheckTaskResult;
        this._maxAttemptsToCheckTaskResultCount = maxAttemptsToCheckTaskResultCount;
    }

    initializeBot(bot: Telegraf) {
        bot.command('all', async (ctx) => {
            this.all(ctx);
        });

        bot.command('active', async (ctx) => {
            this.active(ctx);
        });

        bot.command('finished', async (ctx) => {
            this.finished(ctx);
        });

        bot.hears(MAGNET_LINK_COMMAND_REG_EXP, async (ctx) => {
            const url = ctx.message.text;

            this.magnet(url, ctx);
        });

        bot.hears(TASK_DETAILS_COMMAND_REG_EXP, async (ctx) => {
            const id = ctx.match[1];

            this.details(id, ctx);
        });

        bot.action(TASK_REMOVE_COMMAND_REG_EXP, (ctx) => {
            const id = ctx.match[1];

            this.remove(id, ctx);
        });

        bot.on(message(), async (ctx) => {
            this.find(ctx);
        })
    }

    private all(ctx: Context) {
        console.log('All tasks');

        this.addTask(async (ctx) => {
            sendMessage(ctx, getTasksInfoText(await this._mainApi.getTasksInfo()));
        }, ctx)
    }

    private active(ctx: Context) {
        this.addTask(async (ctx) => {
            const tasks = await this._mainApi.getTasksInfo(getFilterByStatus('Downloading', 'notbegin'));

            sendMessage(ctx, getTasksInfoText(tasks));
        }, ctx)
    }

    private finished(ctx: Context) {
        this.addTask(async (ctx) => {
            sendMessage(ctx, getTasksInfoText(await this._mainApi.getTasksInfo(getFilterByStatus('Finished'))));
        }, ctx)
    }

    private magnet(url: string, ctx: Context) {
        this.addTask(async (ctx) => {
            console.log(`Add task with magnet link:`, url);

            await this._mainApi.addTask({url: url});

            console.log('Get torrent name');

            const torrentName = await getTorrentNameFromUrlAsync(url);

            console.log(`Torrent name: `, torrentName);

            try {
                await retryAttempt(async () => {
                    const tasks = await this._mainApi.getTasksInfo(getFilterByName(torrentName));

                    if (tasks.length > 0) {
                        sendMessage(ctx, getTaskInfoText(tasks[0]));

                        return true;
                    }

                    return false
                }, this._delayBetweenAttemptsToCheckTaskResult, this._maxAttemptsToCheckTaskResultCount);
            } catch {
                throw new Error(`For some reason task with name '${torrentName}' was not found 😕`);
            }
        }, ctx)
    }

    private details(id: string, ctx: Context) {
        this.addTask(async (ctx) => {
            const taskInfos = await this._mainApi.getTasksInfo(getFilterById(id));

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
    }

    private remove(id: string, ctx: Context) {
        this.addTask(async (ctx) => {
            await this._mainApi.removeTask(id);

            try {
                await retryAttempt(async () => {
                    const tasks = await this._mainApi.getTasksInfo(getFilterById(id));

                    if (tasks.length === 0) {
                        sendMessage(ctx, ReplyTextType.TASK_REMOVED);

                        return true;
                    }

                    return false;
                }, this._delayBetweenAttemptsToCheckTaskResult, this._maxAttemptsToCheckTaskResultCount);
            } catch {
                throw new Error('For some reason task was not removed 😕');
            }
        }, ctx);
    }

    private find(ctx: Context) {
        const {text: message} = ctx;

        if (!message) {
            sendErrorMessage(ctx, 'Message is empty');

            return;
        }

        this._authorizedSessionExecutor.addNewTask(async (ctx) => {
            const tasks = await this._mainApi.getTasksInfo(getFilterByName(message));

            sendMessage(ctx, getTasksInfoText(tasks));
        }, ctx)
    }

    private addTask(task: AuthorizedSessionTask, context: Context) {
        this._authorizedSessionExecutor.addNewTask(task, context);
    }
}