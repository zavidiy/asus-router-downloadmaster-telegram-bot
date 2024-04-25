import {toBase64} from './utils';
import {AddTaskData, LoginData} from './types';

export class MainApi {
    private headers: Headers = new Headers({
        'Content-type': 'application/x-www-form-urlencoded',
    })

    constructor(private readonly _url: string) {
    }

    async login({username, password}: LoginData) {
        const payload = {
            flag: '',
            login_username: toBase64(username),
            login_passwd: toBase64(password),
            directurl: '/downloadmaster/task.asp',
        };

        const response = await fetch(`${this._url}/check.asp`, {
            method: 'POST',
            headers: this.headers,
            body: new URLSearchParams(payload),
        });

        if (!response.ok) {
            throw new Error(`Login failed with status: '${response.statusText}'.`);
        }

        const cookie = response.headers.get('set-cookie');

        if (!cookie) {
            throw new Error(`Can not get AuthToken.`);
        }

        this.headers.set('Cookie', cookie);

        return response;
    }

    async addTask({url}: AddTaskData) {
        const urlSearchParams = new URLSearchParams({
            action_mode: 'DM_ADD',
            download_type: '5',
            again: 'no',
            usb_dm_url: url,
        });

        const response = await fetch(`${this._url}/downloadmaster/dm_apply.cgi?${urlSearchParams.toString()}`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to add task with status: '${response.statusText}'.`);
        }

        return response;
    }

    async logout() {
        const response = await fetch(`${this._url}/downloadmaster/Logout.asp`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to logout with status: '${response.statusText}'.`);
        }

        return response;
    }
}