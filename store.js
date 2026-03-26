import fs from "fs";

const FILE = "./state.json";

export function loadState() {
  if (!fs.existsSync(FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function saveState(state) {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}