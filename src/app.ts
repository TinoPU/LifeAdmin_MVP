import express, { Request, Response } from "express";
import dotenv from "dotenv";
import taskRoutes from "./api/tasks";
import webhookRoutes from "./api/webhooks";
// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/webhooks", webhookRoutes)


// Sample endpoint for testing
app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to the WhatsApp Task Agent!");
});

export default app;
