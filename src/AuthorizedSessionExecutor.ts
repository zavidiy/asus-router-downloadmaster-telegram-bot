import {MainApi} from './MainApi/MainApi';
import {sendErrorMessage} from './utils';
import {LoginData} from './MainApi/types';
import {Context} from 'telegraf';

export type AuthorizedSessionTask = (ctx: Context) => Promise<void>;

export type AuthorizedSessionTaskWithContext = {
    task: AuthorizedSessionTask,
    context: Context
};

export class AuthorizedSessionExecutor {
    private readonly _tasks: AuthorizedSessionTaskWithContext[] = [];

    private _currentTask?: AuthorizedSessionTaskWithContext;

    constructor(private readonly _mainApi: MainApi, private readonly _loginData: LoginData) {
    }

    addNewTask(task: AuthorizedSessionTask, context: Context) {
        this._tasks.push({
            task: task,
            context: context
        });

        if (this._currentTask) {
            return;
        }

        this.runTasksWithAuthorization();
    }

    private async runTasksWithAuthorization() {
        console.log('Run tasks with authorization');

        this.updateTask();

        if (!this._currentTask) {
            return;
        }

        const {context} = this._currentTask;

        let loginSucceed = false;

        try {
            console.log('Login');
            await this._mainApi.login(this._loginData);

            loginSucceed = true;
        } catch (error: any) {
            sendErrorMessage(context, `Can not login with error:\n${error}`);
        }

        if (loginSucceed) {
            try {
                await this.runTask(false);
            } catch (error: any) {
                sendErrorMessage(context, error);
            } finally {
                try {
                    console.log('Logout');
                    await this._mainApi.logout();
                } catch (error: any) {
                    sendErrorMessage(context, `Can not logout with error:\n${error}`);
                }
            }
        }

        this._currentTask = undefined;
    }

    private async runTask(updateTask = true) {
        console.log(`Run task`);

        if (updateTask) {
            this.updateTask();
        }

        if (!this._currentTask) {
            console.log('No tasks');
            return;
        }

        const {task, context} = this._currentTask;

        console.log('Run task');

        await task(context);

        console.log('Task done');

        await this.runTask();
    }

    private updateTask() {
        this._currentTask = this._tasks.shift();

        console.log('Update task - ', this._currentTask !== undefined);
    }
}