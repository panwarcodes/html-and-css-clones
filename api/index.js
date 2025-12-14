import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const BASE = path.join(process.cwd(), "sites");
  const urlPath = decodeURIComponent(req.query.path || "");
  const fullPath = path.join(BASE, urlPath);

  // Security: block traversal
  if (!fullPath.startsWith(BASE)) {
    return res.status(403).send("Forbidden");
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("Not found");
  }

  const stat = fs.statSync(fullPath);

  // ✅ DIRECTORY
  if (stat.isDirectory()) {
    const indexFile = path.join(fullPath, "index.html");

    // 🔥 AUTO-PREVIEW index.html
    if (fs.existsSync(indexFile)) {
      res.setHeader("Content-Type", "text/html");
      return res.send(fs.readFileSync(indexFile));
    }

    // Otherwise list directory
    const items = fs.readdirSync(fullPath, { withFileTypes: true });

    const list = items.map(i => `
      <li>
        <a href="/?path=${path.posix.join(urlPath, i.name)}${i.isDirectory() ? "/" : ""}">
          ${i.isDirectory() ? "📁" : "📄"} ${i.name}
        </a>
      </li>
    `).join("");

    return res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Index of /${urlPath}</title>
  <style>
    body { font-family: monospace; padding: 30px; }
    li { margin: 6px 0; }
    a { text-decoration: none; }
  </style>
</head>
<body>

<h2>Index of /${urlPath}</h2>
<ul>
  ${urlPath ? `<li><a href="/?path=${urlPath.split("/").slice(0,-1).join("/")}">⬅ Back</a></li>` : ""}
  ${list}
</ul>

</body>
</html>
    `);
  }

  // ✅ FILE → let browser render it
  const ext = path.extname(fullPath);
  const typeMap = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg"
  };

  res.setHeader("Content-Type", typeMap[ext] || "application/octet-stream");
  res.send(fs.readFileSync(fullPath));
}
