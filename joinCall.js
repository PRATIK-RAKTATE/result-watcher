import twilio from "twilio";
import "dotenv/config";

// ---- ENV VALIDATION ----
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  throw new Error("Missing Twilio environment variables");
}

// ---- CONFIG ----
const TO_NUMBER = "+918830438869";
const DAILY_LIMIT = 10;

// 🔥 ADD THIS (your hosted audio)
const AUDIO_URL = "https://result-watcher.netlify.app/alert.mp3"; // must be public HTTPS

// ---- SIMPLE IN-MEMORY LIMIT (for demo only) ----
let callsToday = 0;

// ---- TWILIO CLIENT ----
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ---- MAIN FUNCTION ----
const makeCall = async () => {
  if (callsToday >= DAILY_LIMIT) {
    throw new Error("Daily call limit exceeded");
  }

  try {
    const call = await client.calls.create({
      to: TO_NUMBER,
      from: TWILIO_PHONE_NUMBER,

      // ✅ Use Play instead of Say
      twiml: `
        <Response>
          <Pause length="1"/>
          <Play>${AUDIO_URL}</Play>
          <Pause length="1"/>
        </Response>
      `
    });

    callsToday++;
    console.log("✅ Call initiated:", call.sid);

  } catch (err) {
    console.error("❌ Call failed:", err.message);
  }
};

// ---- EXECUTE ----
makeCall();