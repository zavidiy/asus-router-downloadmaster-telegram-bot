import {LoginData} from './MainApi/types';
import {Context} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {TaskInfo, TaskStatusType} from './MainApi/MainApi';
import {TASK_DETAILS_COMMAND_PREFIX} from './config';
import WebTorrent from 'webtorrent';

export function getApiURL() {
    const url = process.env.ROUTER_API_URL;

    if (!url) {
        throw new Error('Environment variable "ROUTER_API_URL" is not set');
    }
    return url;
}

export function getLoginData(): LoginData {
    const username = process.env.USER_NAME;

    if (!username) {
        throw new Error('Environment variable "USER_NAME" is not set');
    }

    const password = process.env.USER_PASSWORD;

    if (!password) {
        throw new Error('Environment variable "USER_PASSWORD" is not set');
    }

    return {
        username: username,
        password: password,
    }
}

export function getTorrentNameFromUrlAsync(url: string) {
    return new Promise<string>((resolve, reject) => {
        const web = new WebTorrent();

        const timeout = setTimeout(() => {
            destroyClient();

            reject('Timeout for getting torrent name');
        }, 30000);

        web.on('error', (error) => {
            clearOperationTimeout();

            destroyClient();

            reject(error);
        });

        web.add(url, ({name}) => {
            console.log('Web', name);

            clearOperationTimeout();

            destroyClient();

            resolve(name);
        });

        function clearOperationTimeout() {
            clearTimeout(timeout);
        }

        function destroyClient() {
            web.destroy();
        }
    })
}

export function sendErrorMessage(context: Context, error: any) {
    sendMessage(context, `❌ <b>${error.toString()}</b>`);
}

export async function retryAttempt(action: (attemptsCount: number, maxAttemptsCount: number) => Promise<boolean>,
                                   delayBetweenAttempts: number,
                                   maxAttemptsCount: number,
                                   attemptsCount: number = 0) {
    console.log(`Retry attempt `, attemptsCount);

    if (await action(attemptsCount, maxAttemptsCount)) {
        return Promise.resolve();
    }

    if (++attemptsCount >= maxAttemptsCount) {
        return Promise.reject('Max attempts count reached');
    }

    await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts));

    return await retryAttempt(action, delayBetweenAttempts, maxAttemptsCount, attemptsCount);
}

export function sendMessage(context: Context, text: string, extra: ExtraReplyMessage = {}) {
    extra = {
        ...extra,
        parse_mode: 'HTML',
    };

    if (context.message) {
        extra = {
            ...extra,
            reply_parameters: {
                ...extra.reply_parameters,
                message_id: context.message?.message_id
            }
        }
    }

    context.reply(text, extra);
}

export function getStatusIcon(status: TaskStatusType) {
    switch (status) {
        case 'Downloading':
            return '⏬';

        case 'Finished':
            return '✅';

        case "notbegin":
            return '⏩';

        default:
            return '❔';
    }
}

export function getTasksInfoText(infos: TaskInfo[]) {
    let reply = '';
    const lastIndex = infos.length - 1;

    infos.forEach((status, index) => {
        reply += `#${index + 1} ${getTaskInfoText(status)}`;

        if (index !== lastIndex) {
            reply += '\n';
        }
    })

    return reply || 'No tasks found';
}

export function getTaskInfoText({id, name, downloaded, size, status}: TaskInfo, addId: boolean = true) {
    let reply = '';

    reply += `<b>${name}</b>\n`;

    if (status !== 'notbegin') {
        reply += `<i>${size}</i>\n`
    }

    reply += getStatusText();

    if (addId) {
        reply += `${TASK_DETAILS_COMMAND_PREFIX}${id}\n`
    }

    function getStatusText() {
        const statusIcon = getStatusIcon(status);

        let text = `<b>${statusIcon} ${status}`;

        if (status === 'Downloading') {
            const percentage = (downloaded * 100).toFixed(1);

            text += ` - ${percentage}%`
        }

        return `${text}</b>\n`;
    }

    return reply;
}