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

    // explicitly marking each Promise as "fire-and-forget"
    const logger = {
        debug: (...args: Parameters<Logtail["debug"]>) => {
            void baseLogger.debug(...args);
        },
        info: (...args: Parameters<Logtail["info"]>) => {
            void baseLogger.info(...args);
        },
        warn: (...args: Parameters<Logtail["warn"]>) => {
            void baseLogger.warn(...args);
        },
        error: (...args: Parameters<Logtail["error"]>) => {
            void baseLogger.error(...args);
        },
    };

    return logger
}
