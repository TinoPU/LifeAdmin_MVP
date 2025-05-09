import express, { Request, Response } from "express";
import {handleIncomingSupabaseWebhook, handleIncomingWAWebhook} from "../services/webhookService";
import {WAIncomingObject} from "../types/incomingWAObject/WAIncomingObject";
import {baseLogger} from "../services/loggingService";

const router = express.Router();


// WHATSAPP ROUTES
router.post("/", async (req: Request, res: Response) => {
    try {
        const body: WAIncomingObject = req.body;
        res.status(200).send({ status: "Message accepted for processing" });
        await handleIncomingWAWebhook(body)
    }
    catch (err) {
        const body: WAIncomingObject = req.body
        await baseLogger.error("Couldn't process Data: ",body.entry[0].changes)
        res.status(200).send({ status: "Data received." });
    } finally {
        await baseLogger.flush()
    }
});


const VERIFY_TOKEN = 'ueE9GzcD436Cw$Ptgna#';  // Replace with your actual token
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the token matches
    if (mode && token === VERIFY_TOKEN) {
        console.log("Webhook verified!");
        res.status(200).send(challenge); // Respond with the challenge
    } else {
        res.status(403).send('Verification failed');
    }
});

//SUPABASE Routes

router.post("/supabase", async (req: Request, res: Response) => {

    const body = req.body;
    res.status(200).send({ status: "Message accepted for processing" });

    try {
        await baseLogger.info("supabase Webhook received", {data: body})
        await handleIncomingSupabaseWebhook(body)
    }
    catch (err) {
        res.status(500).json({ error: (err as Error).message });
    } finally {
        await baseLogger.flush()
    }
});


export default router;
