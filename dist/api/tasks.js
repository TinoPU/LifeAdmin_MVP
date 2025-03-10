"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskService_1 = require("../services/taskService");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    const { description, dueTime } = req.body;
    try {
        const task = await (0, taskService_1.createTask)(description, dueTime);
        res.status(201).json({ task });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
