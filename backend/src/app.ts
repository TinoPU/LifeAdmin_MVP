import express, { Request, Response } from "express";
import dotenv from "dotenv";
import taskRoutes from "./api/tasks";
import supabase from "./database/client";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

app.use("/api/tasks", taskRoutes);

// Sample endpoint for testing
app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to the WhatsApp Task Agent!");
});

export default app;
