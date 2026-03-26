import { request, Agent } from "undici";
import   { CONFIG } from './config.js'

const agent = new Agent({
  connect: {
    rejectUnauthorized: false // ⚠ controlled bypass
  }
});

export async function fetchPage() {
  const { body, headers } = await request(CONFIG.URL, {
    dispatcher: agent,
    method: "GET",
    headers: {
      "user-agent": "Mozilla/5.0 (result-watcher)"
    }
  });

  const html = await body.text();

  return {
    html,
    etag: headers.etag,
    lastModified: headers["last-modified"]
  };
}