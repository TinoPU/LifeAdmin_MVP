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

export function initLogger(user: User) {
    const logtail = new Logtail(process.env.LOGTAIL_SOURCE!, {
        endpoint: 'https://s1303935.eu-nbg-2.betterstackdata.com',
    })
    logtail.use((log) => enrichLogs(log, user));

    function fireAndForget<T extends (...args: any[]) => Promise<any>>(fn: T) {
        return (...args: Parameters<T>) => {
            // kick off the promise, but don't force callers to await
            fn(...args).catch((err) => {
                // optionally: console.error("Logtail failed:", err)
            });
        };
    }
    const logger = {
        debug: fireAndForget(logtail.debug.bind(logtail)),
        info:  fireAndForget(logtail.info.bind(logtail)),
        warn:  fireAndForget(logtail.warn.bind(logtail)),
        error: fireAndForget(logtail.error.bind(logtail)),
    }
    return logger
}
