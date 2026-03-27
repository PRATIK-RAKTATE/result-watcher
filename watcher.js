import { fetchPage } from "./fetcher.js";
import { normalize } from "./normalizer.js";
import { hash } from "./hasher.js";
import { loadState, saveState } from "./store.js";
import { notify } from "./notifier.js";
import { triggerCall } from "./caller.js";

// Prevent overlapping executions (critical in cron environments)
let isRunning = false;

export async function checkForUpdate() {
  if (isRunning) {
    console.log("Skipped: previous execution still running");
    return;
  }

  isRunning = true;

  try {
    const state = loadState() || {};

    const { html, etag, lastModified } = await fetchPage();

    // HTTP-level optimization
    if (
      state.etag === etag &&
      state.lastModified === lastModified
    ) {
      console.log("No change (headers match)");
      return;
    }

    const normalized = normalize(html);
    const newHash = hash(normalized);

    if (!state.hash) {
      console.log("Initial snapshot stored");
      saveState({ hash: newHash, etag, lastModified });
      return;
    }

    if (newHash !== state.hash) {
      console.log("Change detected, confirming...");

      // retry confirmation (avoid false positives)
      await new Promise((r) => setTimeout(r, 30000));

      const retry = await fetchPage();
      const retryHash = hash(normalize(retry.html));

      if (retryHash === newHash) {
        notify("Result page changed! Possible result declared.");

        // external side-effect (keep awaited for correctness)
        await triggerCall();

        saveState({
          hash: newHash,
          etag: retry.etag,
          lastModified: retry.lastModified,
        });
      } else {
        console.log("False alarm avoided");
      }
    } else {
      console.log("No meaningful change");
    }
  } catch (err) {
    console.error("Watcher error:", err?.message || err);
  } finally {
    isRunning = false;
  }
}