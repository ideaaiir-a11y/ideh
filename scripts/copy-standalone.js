const fs = require("fs");
const path = require("path");

const dirs = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

dirs.forEach(([src, dst]) => {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src).forEach((f) => {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) fs.cpSync(s, d, { recursive: true });
    else fs.cpSync(s, d);
  });
  console.log("copied", src, "->", dst);
});
