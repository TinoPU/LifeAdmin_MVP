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

export function initLogger(user: User) {
    baseLogger.use((log) => enrichLogs(log, user));

    function fireAndForget<T extends (...args: any[]) => Promise<any>>(fn: T) {
        return (...args: Parameters<T>) => {
            // kick off the promise, but don't force callers to await
            fn(...args).catch((err) => {
                // optionally: console.error("Logtail failed:", err)
            });
        };
    }
    const logger = {
        debug: fireAndForget(baseLogger.debug.bind(baseLogger)),
        info:  fireAndForget(baseLogger.info.bind(baseLogger)),
        warn:  fireAndForget(baseLogger.warn.bind(baseLogger)),
        error: fireAndForget(baseLogger.error.bind(baseLogger)),
    }
    return logger
}
