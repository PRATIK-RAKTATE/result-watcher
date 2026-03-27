import twilio from "twilio";
import "dotenv/config";
import fs from "fs";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  CALLING_DISABLED
} = process.env;

const TO_NUMBER = "+918830438869";
const DAILY_LIMIT = 1;
const AUDIO_URL = "https://result-watcher.netlify.app/alert.mp3";
const LIMIT_FILE = "./call-limit.json";

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const loadState = () => {
  if (!fs.existsSync(LIMIT_FILE)) return { date: null, count: 0 };
  return JSON.parse(fs.readFileSync(LIMIT_FILE, "utf-8"));
};

const saveState = (state) => {
  fs.writeFileSync(LIMIT_FILE, JSON.stringify(state));
};

const checkLimit = () => {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();

  if (state.date !== today) return { date: today, count: 0 };
  if (state.count >= DAILY_LIMIT) throw new Error("Daily limit reached");

  return state;
};

// ✅ EXPORT THIS (important)
export const triggerCall = async () => {
  if (CALLING_DISABLED === "true") return;

  const state = checkLimit();

  const call = await client.calls.create({
    to: TO_NUMBER,
    from: TWILIO_PHONE_NUMBER,
    twiml: `
      <Response>
        <Pause length="1"/>
        <Play>${AUDIO_URL}</Play>
        <Say>Fallback audio</Say>
      </Response>
    `
  });

  state.count += 1;
  saveState(state);

  console.log("📞 Call triggered:", call.sid);
};