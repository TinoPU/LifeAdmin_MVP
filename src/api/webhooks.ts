import express, { Request, Response } from "express";
import {handleIncomingWAWebhook} from "../services/webhookService";

const router = express.Router();


// WHATSAPP ROUTES
router.post("/", async (req: Request, res: Response) => {
    try {

        const body = req.body;
        await handleIncomingWAWebhook(body)
        res.status(200).send({ status: "Message processed." });
    }
    catch (err) {
        res.status(500).json({ error: (err as Error).message });
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
    try {

        const body = req.body;
        console.log(body)
        res.status(200).send({ status: "Message processed." });
    }
    catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});








export default router;
