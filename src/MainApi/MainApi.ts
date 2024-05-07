import {toBase64} from './utils';
import {AddTaskData, LoginData} from './types';

export type TaskStatusType = 'Finished' | 'Downloading' | 'notbegin';

export type TaskInfo = {
    id: string;
    name: string;
    downloaded: number;
    size: number;
    status: TaskStatusType;
}

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

    async removeTask(id: string) {
        const urlSearchParams = new URLSearchParams({
            action_mode: 'DM_CTRL',
            dm_ctrl: 'cancel',
            task_id: id,
            download_type: 'BT'
        });

        const response = await fetch(`${this._url}/downloadmaster/dm_apply.cgi?${urlSearchParams.toString()}`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to remove task with status: '${response.statusText}'.`);
        }

        return response;
    }

    async getTasksInfo(filter?: (t: TaskInfo) => boolean): Promise<TaskInfo[]> {
        const urlSearchParams = new URLSearchParams({
            action_mode: 'All'
        });

        const response = await fetch(`${this._url}/downloadmaster/dm_print_status.cgi?${urlSearchParams.toString()}`, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to get tasks with status: '${response.statusText}'.`);
        }

        const arrayBuffer = await response.arrayBuffer();

        const rawData = new TextDecoder().decode(arrayBuffer).split('\n,');

        const statuses: TaskInfo[] = [];

        for (const data of rawData) {
            const [id, name, downloaded, size, status] = JSON.parse(data);

            const taskStatus = {
                id,
                name,
                downloaded,
                size,
                status
            };

            if (filter && !filter(taskStatus)) {
                continue;
            }

            statuses.push(taskStatus);
        }

        return statuses;
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