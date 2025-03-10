import express, { Request, Response } from "express";
import sendMessage from "../services/messageService";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    try {

        const body = req.body;
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        const from = message.from; // Sender's phone number
        const text = message.text?.body || ""; // Message content

        console.log(`📩 Received message from ${from}: "${text}"`);
        await sendMessage(from, `Hi there! You said: "${text}"`);
        res.status(200).send({ status: "Message processed." });
    }
    catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

router.get("/verify", (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified!");
        res.status(200).send(challenge);
    } else {
        res.status(403).send("Verification failed.");
    }
});




export default router;
