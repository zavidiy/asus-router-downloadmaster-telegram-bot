import * as dotenv from 'dotenv';
import {Telegraf} from 'telegraf';
import {getApiURL, getLoginData} from './utils';
import {MainApi} from './MainApi/MainApi';
import {AuthorizedSessionExecutor} from './AuthorizedSessionExecutor';
import {Application} from './Application';

dotenv.config();

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
    throw new Error('Environment variable "BOT_TOKEN" is not set');
}

const bot = new Telegraf(botToken);
const mainApi = new MainApi(getApiURL());
const authorizedSessionExecutor = new AuthorizedSessionExecutor(mainApi, getLoginData());
const application = new Application(mainApi, authorizedSessionExecutor);

application.initializeBot(bot);

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
