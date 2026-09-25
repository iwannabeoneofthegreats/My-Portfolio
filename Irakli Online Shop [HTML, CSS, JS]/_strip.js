const fs = require("fs");
const dir = "C:/Games/coding file/Irakli Online Shop [HTML, CSS, JS]/";

function stripJs(code) {
  let out = "", i = 0, n = code.length, str = null;
  while (i < n) {
    const c = code[i], c2 = code[i + 1];
    if (str) {
      out += c;
      if (c === "\\") { out += (code[i + 1] || ""); i += 2; continue; }
      if (c === str) str = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { str = c; out += c; i++; continue; }
    if (c === "/" && c2 === "/") { while (i < n && code[i] !== "\n") i++; continue; }
    if (c === "/" && c2 === "*") { i += 2; while (i < n && !(code[i] === "*" && code[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}
const stripCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
const stripHtml = (s) => s.replace(/<!--[\s\S]*?-->/g, "");
const tidy = (s) => s.split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n");

const js = ["api.js", "app.js", "cart.js", "details.js", "profile.js"];
const css = ["style.css"];
const html = ["index.html", "cart.html", "details.html", "profile.html"];

function process(file, fn) {
  const p = dir + file;
  const c = fs.readFileSync(p, "utf8");
  fs.writeFileSync(p + ".bak", c);
  fs.writeFileSync(p, tidy(fn(c)));
  console.log("stripped:", file);
}
js.forEach((f) => process(f, stripJs));
css.forEach((f) => process(f, stripCss));
html.forEach((f) => process(f, stripHtml));
console.log("DONE");
