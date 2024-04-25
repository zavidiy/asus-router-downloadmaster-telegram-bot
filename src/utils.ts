import {LoginData} from './MainApi/types';
import {Context} from 'telegraf';

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

export function sendErrorMessage(context: Context, error: any, replyToMessageId?: number) {
    sendMessage(context, `❌ ${error.toString()}`, replyToMessageId);
}

export function sendMessage(context: Context, text: string, replyToMessageId?: number) {
    context.reply(text, replyToMessageId ? {reply_parameters: {message_id: replyToMessageId}} : undefined);
}
