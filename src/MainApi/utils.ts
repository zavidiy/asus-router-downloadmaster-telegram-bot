import {TaskStatus, TaskStatusType} from './MainApi';

export function toBase64(data: string): string {
    return Buffer.from(data).toString('base64');
}

export function getFilterByStatus(...statusTypes: TaskStatusType[]): (t: TaskStatus) => boolean {
    return ({status}: TaskStatus) => {
        return statusTypes.length === 0 || statusTypes.includes(status);
    }
}

export function getFilterByName(message: string) {
    message = message.toLowerCase();

    return ({name}: TaskStatus) => name.toLowerCase().includes(message);
}
