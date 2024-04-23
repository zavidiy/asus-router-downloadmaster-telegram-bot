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

        const res = await fetch(`${this._url}/check.asp`, {
            method: 'POST',
            headers: this.headers,
            body: new URLSearchParams(payload),
        });

        this.headers.set('Cookie', res.headers.get('set-cookie')!);

        return res;
    }

    async addTask({url}: AddTaskData) {
        const urlSearchParams = new URLSearchParams({
            action_mode: 'DM_ADD',
            download_type: '5',
            again: 'no',
            usb_dm_url: url,
        });

        return await fetch(`${this._url}/downloadmaster/dm_apply.cgi?${urlSearchParams.toString()}`, {
            method: 'GET',
            headers: this.headers,
        });
    }
}