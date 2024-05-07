import {TaskInfo, TaskStatusType} from './MainApi';

export function toBase64(data: string): string {
    return Buffer.from(data).toString('base64');
}

export function getFilterByStatus(...statusTypes: TaskStatusType[]): (t: TaskInfo) => boolean {
    return ({status}: TaskInfo) => {
        return statusTypes.length === 0 || statusTypes.includes(status);
    }
}

export function getFilterById(filter: string) {
    return ({id}: TaskInfo) => id === filter;
}

export function getFilterByName(filter: string) {
    filter = filter.toLowerCase();

    return ({name}: TaskInfo) => name.toLowerCase().includes(filter);
}
