import { Langfuse } from "langfuse";
import {Logtail} from "@logtail/node";
import {User} from "../types/db";
import { ILogtailLog } from "@logtail/types";


export const langfuse = new Langfuse();

async function enrichLogs(log: ILogtailLog, user:User): Promise<ILogtailLog> {
    return {
        ...log,
        user: user
    };
}

export const baseLogger = new Logtail(process.env.LOGTAIL_SOURCE!, {
    endpoint: process.env.LOGTAIL_ENDPOINT,
})

const pendingLogs = new Set<Promise<any>>();


function makeVoidAndTrack<T extends (...args: any[]) => Promise<any>>(fn: T) {
    return (...args: Parameters<T>): void => {
        const p = fn(...args).catch(() => { /* swallow any log errors */ });
        pendingLogs.add(p);
        // remove once settled
        p.finally(() => pendingLogs.delete(p));
    };
}

export function initLogger(user: User) {
    baseLogger.use((log) => enrichLogs(log, user));

    return {
        debug: makeVoidAndTrack(baseLogger.debug.bind(baseLogger)),
        info:  makeVoidAndTrack(baseLogger.info.bind(baseLogger)),
        warn:  makeVoidAndTrack(baseLogger.warn.bind(baseLogger)),
        error: makeVoidAndTrack(baseLogger.error.bind(baseLogger)),
    };
}


export async function drainLogsAndFlush() {
    // wait for every pending log to enqueue
    console.log("Pending Logs: ", pendingLogs)
    await Promise.all(Array.from(pendingLogs));
    // then flush the buffer
    await baseLogger.flush();
}
