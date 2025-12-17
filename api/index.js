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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Index of /${urlPath}</title>

  <style>
    :root {
      --bg: #0f172a;
      --card: #111827;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --accent: #38bdf8;
      --accent-hover: #0ea5e9;
      --border: rgba(255, 255, 255, 0.08);
      --radius: 14px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: radial-gradient(1200px 600px at top, #020617, var(--bg));
      color: var(--text);

      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px;
    }

    .container {
      width: 100%;
      max-width: 900px;
      background: linear-gradient(180deg, #020617, var(--card));
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 22px 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
    }

    h2 {
      margin: 0 0 16px;
      font-size: clamp(1.1rem, 2.5vw, 1.4rem);
      font-weight: 600;
      color: #f8fafc;
      word-break: break-all;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 8px;
    }

    li {
      border-radius: 10px;
      transition: background 0.15s ease, transform 0.05s ease;
    }

    li:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    a {
      display: block;
      padding: 10px 12px;
      text-decoration: none;
      color: var(--text);
      word-break: break-all;
    }

    a:hover {
      color: var(--accent);
    }

    .back a {
      color: var(--accent);
      font-weight: 500;
    }

    .back a:hover {
      color: var(--accent-hover);
    }

    /* Floating credit badge */
    .footer-creds {
      position: fixed;
      bottom: 16px;
      right: 16px;

      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #020617;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;

      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.35);
      opacity: 0.9;
      transition: transform 0.15s ease, opacity 0.15s ease;
      z-index: 999;
    }

    .footer-creds:hover {
      opacity: 1;
      transform: translateY(-2px);
    }

    /* Mobile tweaks */
    @media (max-width: 480px) {
      body {
        padding: 14px;
      }

      .container {
        padding: 16px;
      }

      .footer-creds {
        font-size: 12px;
        padding: 7px 10px;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <h2>Index of /${urlPath}</h2>

    <ul>
      ${
        urlPath
          ? `<li class="back">
               <a href="/?path=${urlPath.split("/").slice(0, -1).join("/")}">
                 ⬅ Back
               </a>
             </li>`
          : ""
      }
      ${list}
    </ul>
  </main>

  <a
    href="https://github.com/panwarcodes"
    class="footer-creds"
    target="_blank"
    rel="noopener"
  >
    Coded by panwarcodes
  </a>
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
