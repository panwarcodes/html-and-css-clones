import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const BASE = path.join(process.cwd(), "sites");
  const urlPath = decodeURIComponent(req.query.path || "");
  const fullPath = path.join(BASE, urlPath);

  // Security check
  if (!fullPath.startsWith(BASE)) {
    res.status(403).send("Forbidden");
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.status(404).send("Not found");
    return;
  }

  const stat = fs.statSync(fullPath);

  // If file → serve it
  if (stat.isFile()) {
    res.send(fs.readFileSync(fullPath));
    return;
  }

  // Directory listing
  const items = fs.readdirSync(fullPath, { withFileTypes: true });

  const list = items.map(i => {
    const slash = i.isDirectory() ? "/" : "";
    return `
      <li>
        <a href="/?path=${path.posix.join(urlPath, i.name)}${slash}">
          ${i.isDirectory() ? "📁" : "📄"} ${i.name}
        </a>
      </li>
    `;
  }).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Repo Index</title>
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
