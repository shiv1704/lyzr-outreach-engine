const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // PROXY ROUTE
  if (req.url === "/api/proxy" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const options = {
        hostname: "agent-prod.studio.lyzr.ai",
        path: "/v3/inference/chat/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "x-api-key": "sk-default-pZcInjl3DZStUYXX9fTMODoDFHeZ9Zpk"
        }
      };

      const proxyReq = https.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", chunk => data += chunk);
        proxyRes.on("end", () => {
          Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
          res.setHeader("Content-Type", "application/json");
          res.writeHead(proxyRes.statusCode);
          res.end(data);
        });
      });

      proxyReq.on("error", (err) => {
        Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // CORS PREFLIGHT
  if (req.method === "OPTIONS") {
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
    res.writeHead(204);
    res.end();
    return;
  }

  // SERVE STATIC FILES
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, "index.html"), (e, c) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(c);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(content);
  });
});

server.timeout = 400000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
