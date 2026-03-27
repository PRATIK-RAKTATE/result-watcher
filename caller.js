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
const DAILY_LIMIT = 10;
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

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 31000; // 31 seconds

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const state = checkLimit();

      console.log(`📞 Attempt ${attempt}...`);

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

      console.log("📞 Call triggered:", call.sid);

      state.count += 1;
      saveState(state);

      // ⏳ Wait before checking status (Twilio needs time)
      await sleep(10000);

      // 🔍 Poll status
      const callDetails = await client.calls(call.sid).fetch();
      const status = callDetails.status;

      console.log("📊 Call status:", status);

      if (status === "in-progress" || status === "completed") {
        console.log("✅ received");
        return;
      }

      // ❌ Not answered cases
      if (
        status === "no-answer" ||
        status === "busy" ||
        status === "failed" ||
        status === "canceled"
      ) {
        if (attempt < MAX_RETRIES) {
          console.log("🔁 trying second call...");
          await sleep(RETRY_DELAY);
          continue;
        } else {
          console.log("❌ Max retries reached. Call not received.");
        }
      } else {
        // unknown/intermediate states
        console.log("⚠️ Unknown state, retrying...");
        await sleep(RETRY_DELAY);
      }

    } catch (err) {
      console.error("💥 Call error:", err.message);

      if (attempt < MAX_RETRIES) {
        console.log("🔁 Retrying after error...");
        await sleep(RETRY_DELAY);
      } else {
        console.log("❌ Max retries reached after errors.");
      }
    }
  }
};