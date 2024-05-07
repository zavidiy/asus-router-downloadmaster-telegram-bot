import {LoginData} from './MainApi/types';
import {Context} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {TaskInfo, TaskStatusType} from './MainApi/MainApi';
import {TASK_DETAILS_COMMAND_PREFIX} from './config';

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

export function isMagnetLink(text: string): boolean {
    const magnetRegex = /magnet:\?xt=urn:[a-z0-9]+:[a-h.0-9]{32,40}(&dn=[^&]+)*(&tr=[^&]+)*(&xl=[^&]+)*/i;

    return magnetRegex.test(text);
}

export function sendErrorMessage(context: Context, error: any) {
    sendMessage(context, `❌ <b>${error.toString()}</b>`);
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