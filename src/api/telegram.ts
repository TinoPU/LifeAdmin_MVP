import express, { Request, Response } from "express";
import {handleIncomingTelegramWebhook} from "../services/telegramWebhookService";
import {TelegramIncomingObject} from "../types/telegram/TelegramIncomingObject";
import {baseLogger, drainLogsAndFlush} from "../services/loggingService";

const router = express.Router();

// TELEGRAM ROUTES
router.post("/", async (req: Request, res: Response) => {
    try {
        const body: TelegramIncomingObject = req.body;
        res.status(200).send({ status: "Message accepted for processing" });
        await handleIncomingTelegramWebhook(body);
    }
    catch (err) {
        const body: TelegramIncomingObject = req.body;
        await baseLogger.warn("Couldn't process Telegram Data", body);
        res.status(200).send({ status: "Data received." });
    } finally {
        await drainLogsAndFlush();
    }
});

// Webhook verification endpoint (optional, for testing)
router.get('/', (req, res) => {
    res.status(200).send('Telegram webhook endpoint is active');
});

export default router;
