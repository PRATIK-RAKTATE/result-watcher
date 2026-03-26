import express from "express";
import cron from "node-cron";
import { checkForUpdate } from "./watcher.js";
import { CONFIG } from "./config.js";
import { getLogs, initLogger } from "./logger.js";
import cors from 'cors';

// ✅ MUST be first
initLogger();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "https://result-watcher.netlify.app"
}));

app.use(express.static("public"));

app.get("/logs", (req, res) => {
  res.json(getLogs());
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

// watcher
checkForUpdate();

cron.schedule(CONFIG.INTERVAL, () => {
  console.log("⏱ Cron triggered");
  checkForUpdate();
});