import { fetchPage } from "./fetcher.js";
import { normalize } from "./normalizer.js";
import { hash } from "./hasher.js";
import { loadState, saveState } from "./store.js";
import { notify } from "./notifier.js";
import { triggerCall } from "./caller.js";

let isRunning = false;

export async function checkForUpdate() {
  const startTime = Date.now();
  console.log("==================================================");
  console.log("🚀 checkForUpdate START", new Date().toISOString());

  if (isRunning) {
    console.log("⛔ Skipped: previous execution still running");
    return;
  }

  isRunning = true;

  try {
    const state = loadState() || {};
    console.log("📦 Loaded state:", JSON.stringify(state));

    console.log("🌐 Fetching page...");
    const { html, etag, lastModified } = await fetchPage();

    console.log("📡 Headers:", { etag, lastModified });
    console.log("📄 RAW HTML LENGTH:", html?.length);

    if (!html || typeof html !== "string") {
      console.log("❌ Invalid HTML received. Aborting...");
      return;
    }

    // ✅ FIX: Only use header optimization if headers actually exist
    const hasValidHeaders = Boolean(etag || lastModified);

    if (
      hasValidHeaders &&
      state.etag === etag &&
      state.lastModified === lastModified
    ) {
      console.log("🟡 No change (headers match)");
      return;
    }

    console.log("🧹 Normalizing HTML...");
    const normalized = normalize(html);

    console.log("🧹 NORMALIZED LENGTH:", normalized?.length);

    const newHash = hash(normalized);
    console.log("🔑 NEW HASH:", newHash);
    console.log("🔑 OLD HASH:", state.hash);

    if (!state.hash) {
      console.log("🆕 Initial snapshot stored");
      saveState({ hash: newHash, etag, lastModified });
      console.log("✅ State saved");
      return;
    }

    if (newHash !== state.hash) {
      console.log("🔴 Change detected! Confirming...");

      await new Promise((r) => setTimeout(r, 1000));

      const retry = await fetchPage();
      const retryHash = hash(normalize(retry.html));

      console.log("🔁 RETRY HASH:", retryHash);

      if (retryHash === newHash) {
        console.log("✅ Confirmed change");

        notify("Result page changed! Possible result declared.");

        console.log("📞 Triggering call...");
        await triggerCall();
        console.log("📞 Call done");

        saveState({
          hash: newHash,
          etag: retry.etag,
          lastModified: retry.lastModified,
        });

        console.log("💾 State updated");
      } else {
        console.log("🟢 False alarm avoided");
      }
    } else {
      console.log("🟢 No meaningful change");
    }
  } catch (err) {
    console.error("💥 Watcher error:", err?.stack || err);
  } finally {
    isRunning = false;
    console.log("🏁 checkForUpdate END in", Date.now() - startTime, "ms");
    console.log("==================================================\n");
  }
}