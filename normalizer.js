export function normalize(html) {
  return html
    .replace(/\s+/g, " ")
    .replace(/<!--.*?-->/g, "")
    .replace(/id=".*?"/g, "") // remove dynamic ids
    .trim();
}