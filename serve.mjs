import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const PORT = process.env.PORT || 8765;
const mime = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".zip": "application/zip",
};

http.createServer((req, res) => {
  const urlPath = req.url === "/" ? "/options.html" : decodeURIComponent(req.url.split("?")[0]);
  let filePath = join("dist/chrome", urlPath);
  if (!existsSync(filePath)) {
    // Tenta na raiz caso seja o .zip
    const rootCandidate = join(".", urlPath);
    if (existsSync(rootCandidate)) filePath = rootCandidate;
    else {
      res.writeHead(404, { "Content-Type": "text/plain;charset=utf-8" });
      return res.end("Arquivo não encontrado");
    }
  }
  const ext = extname(filePath);
  const headers = { "Content-Type": mime[ext] || "application/octet-stream" };
  if (ext === ".zip") {
    headers["Content-Disposition"] = `attachment; filename="${urlPath.replace(/^\//, "")}"`;
  }
  res.writeHead(200, headers);
  res.end(readFileSync(filePath));
}).listen(PORT, () => {
  console.log(`Atalhos Arcanjo rodando em: http://localhost:${PORT}`);
});
