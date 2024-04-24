import {LoginData} from './MainApi/types';

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
