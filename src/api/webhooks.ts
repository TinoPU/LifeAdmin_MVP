import express, { Request, Response } from "express";
import sendMessage from "../services/messageService";
import messageLLM from "../services/llmService";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    try {

        const body = req.body;
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        const from = message.from; // Sender's phone number
        const text = message.text?.body || ""; // Message content

        console.log(`📩 Received message from ${from}: "${text}"`);
        const agentResponse = await messageLLM(text)
        await sendMessage(from, `Hi there! You said: "${agentResponse}"`);
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


export default router;
