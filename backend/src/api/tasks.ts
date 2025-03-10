import express, { Request, Response } from "express";
import { createTask } from "../services/taskService";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
    const { description, dueTime } = req.body;

    try {
        const task = await createTask(description, dueTime);
        res.status(201).json({ task });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

export default router;
