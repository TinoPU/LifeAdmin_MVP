import express, { Request, Response } from "express";
import {handleIncomingTelegramWebhook} from "../services/telegramWebhookService";
import {TelegramIncomingObject} from "../types/telegram/TelegramIncomingObject";
import {baseLogger, drainLogsAndFlush} from "../services/loggingService";

const router = express.Router();

// TELEGRAM ROUTES
router.post("/", async (req: Request, res: Response) => {
    const body: TelegramIncomingObject = req.body;

    // A helper that sends 200 after 60s regardless of state
    const timeout = new Promise<void>((resolve) => {
        setTimeout(() => {
            if (!res.headersSent) {
                res.status(200).send({ status: "Accepted (timeout safeguard)" });
            }
            resolve();
        }, 60_000);
    });

    try {
        // Race your handler against the timeout
        await Promise.race([
            (async () => {
                await handleIncomingTelegramWebhook(body);
                if (!res.headersSent) {
                    res.status(200).send({ status: "Message accepted for processing" });
                }
            })(),
            timeout,
        ]);
    } catch (err) {
        // Log the error, but still send 200 to stop Telegram retries
        await baseLogger.warn("Couldn't process Telegram Data", body);
        if (!res.headersSent) {
            res.status(200).send({ status: "Data received with error" });
        }
    } finally {
        await drainLogsAndFlush();
    }
});


// Webhook verification endpoint (optional, for testing)
router.get('/', (req, res) => {
    res.status(200).send('Telegram webhook endpoint is active');
});

export default router;
