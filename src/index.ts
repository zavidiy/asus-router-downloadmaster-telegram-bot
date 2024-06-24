import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {getApiURL, getLoginData} from './utils';
import {MainApi} from './MainApi/MainApi';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';
import {Application} from './Application/Application';
import express from 'express';

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const webHookUrl = process.env.WEB_HOOK_URL;
const delayBetweenAttemptsToCheckTaskResult = process.env.DELAY_BETWEEN_ATTEMPTS_TO_CHECK_TASK_RESULT;
const maxAttemptsToCheckTaskResultCount = process.env.MAX_ATTEMPTS_TO_CHECK_TASK_RESULT_COUNT;

if (!botToken) {
    throw new Error('Environment variable "BOT_TOKEN" is not set');
}

if (!webHookUrl) {
    throw new Error('Environment variable "WEB_HOOK_URL" is not set');
}

if (!maxAttemptsToCheckTaskResultCount) {
    throw new Error('Environment variable "MAX_ATTEMPTS_TO_CHECK_TASK_RESULT_COUNT" is not set');
}

if (!delayBetweenAttemptsToCheckTaskResult) {
    throw new Error('Environment variable "DELAY_BETWEEN_ATTEMPTS_TO_CHECK_TASK_RESULT" is not set');
}

const bot = new Telegraf(botToken);
const mainApi = new MainApi(getApiURL());
const authorizedSessionExecutor = new AuthorizedSessionExecutor(mainApi, getLoginData());
const application = new Application(mainApi, authorizedSessionExecutor, {
    maxAttemptsToCheckTaskResultCount: parseInt(maxAttemptsToCheckTaskResultCount),
    delayBetweenAttemptsToCheckTaskResult: parseInt(delayBetweenAttemptsToCheckTaskResult)
});

application.initializeBot(bot);

if (process.env.ENV === 'dev') {
    bot.launch();

    process.once('SIGINT', () => {
        bot.stop('SIGINT');

        process.exit(0);
    })
    process.once('SIGTERM', () => {
        bot.stop('SIGTERM');

        process.exit(0);
    })
} else {
    const app = express();

    app.use(express.urlencoded({extended: true}));

    app.use(express.json());

    app.post('/', async (req, res) => {
        const message = req.body;

        console.log('Post message', JSON.stringify(message));

        await bot.handleUpdate(message, res);
    });

    app.listen(process.env.PORT, () => {
        console.log(`App listening at port ${process.env.PORT}`);
    });
}