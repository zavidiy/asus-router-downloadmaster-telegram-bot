export const DELAY_BETWEEN_ATTEMPTS_TO_CHECK_TASK_RESULT = 5000;

export const MAX_ATTEMPTS_TO_CHECK_TASK_RESULT_COUNT = 20;

export const TASK_DETAILS_COMMAND_PREFIX = '/info_task_';

export const TASK_REMOVE_COMMAND_PREFIX = '/remove_task_';

export const TASK_DETAILS_COMMAND_REG_EXP = new RegExp(`${TASK_DETAILS_COMMAND_PREFIX}(.+)`);

export const TASK_REMOVE_COMMAND_REG_EXP = new RegExp(`${TASK_REMOVE_COMMAND_PREFIX}(.+)`);

export const MAGNET_LINK_COMMAND_REG_EXP = /magnet:\?xt=urn:[a-z0-9]+:[a-h.0-9]{32,40}(&dn=[^&]+)*(&tr=[^&]+)*(&xl=[^&]+)*/i;
