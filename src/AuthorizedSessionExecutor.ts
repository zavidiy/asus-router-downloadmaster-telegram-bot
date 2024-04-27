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

    addTask(task: AuthorizedSessionTask, context: Context) {
        this._tasks.push({
            task: task,
            context: context
        });

        if (this._currentTask) {
            return;
        }

        this.runTaskWithAuthorization();
    }

    private async runTaskWithAuthorization() {
        this.updateTask();

        if(!this._currentTask) {
            return;
        }

        const {context} = this._currentTask;

        let loginSucceed = false;

        try {
            await this._mainApi.login(this._loginData);

            loginSucceed = true;
        } catch(error: any) {
            sendErrorMessage(context, error);
        }

        if(loginSucceed) {
            try {
                await this.runTask(false);
            } catch (error: any) {
                sendErrorMessage(context, error);
            } finally {
                try {
                    await this._mainApi.logout();
                } catch (error: any) {
                    sendErrorMessage(context, error);
                }
            }
        }

        if (this._tasks.length > 0) {
            this.runTaskWithAuthorization();
        } else {
            this._currentTask = undefined;
        }
    }

    private async runTask(updateTask = true) {
        if (updateTask) {
            this.updateTask();
        }

        if (!this._currentTask) {
            return;
        }

        const {task, context} = this._currentTask;

        await task(context);

        await this.runTask();
    }

    private updateTask() {
        this._currentTask = this._tasks.shift();
    }
}