import {LoginData} from './MainApi/types';
import {Context} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {TaskStatus, TaskStatusType} from './MainApi/MainApi';

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

export function sendErrorMessage(context: Context, error: any) {
    sendMessage(context, `❌ <b>${error.toString()}</b>`);
}

export function sendMessage(context: Context, text: string) {
    let extra: ExtraReplyMessage = {
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
        case 'notbegin':
            return '⏩';
        default:
            return '✅';
    }
}

export function getStatusesText(statuses: TaskStatus[]) {
    let reply = '';
    const lastIndex = statuses.length - 1;

    statuses.forEach(({name, downloaded, size, status}, index) => {
        reply += `#${index + 1} <b>${name}</b>\n`;

        if (status !== 'notbegin') {
            reply += `<i>${size}</i>\n`
        }

        reply += getStatusText();

        if (index !== lastIndex) {
            reply += '\n\n';
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
    })

    return reply || 'No tasks found';
}