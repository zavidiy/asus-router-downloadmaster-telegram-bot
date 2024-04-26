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
        console.log('Running task with authorization');

        try {
            await this._mainApi.login(this._loginData);

            await this.runTask();
        } catch (error: any) {
            sendErrorMessage(this._currentTask!.context, error);
        } finally {
            try {
                await this._mainApi.logout();
            } catch (error: any) {
                sendErrorMessage(this._currentTask!.context, error);
            }
        }
    }

    private async runTask() {
        this._currentTask = this._tasks.shift();

        if (!this._currentTask) {
            return;
        }

        const {task, context} = this._currentTask;

        await task(context);

        await this.runTask();
    }
}