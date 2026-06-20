const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  function setCors() {
    Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  }

  // CORS PREFLIGHT
  if (req.method === "OPTIONS") {
    setCors();
    res.writeHead(204);
    res.end();
    return;
  }

  // PROXY ROUTE — match any URL containing /api/proxy
  if (req.url.includes("/api/proxy")) {
    if (req.method !== "POST") {
      setCors();
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed, use POST" }));
      return;
    }

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
          setCors();
          res.setHeader("Content-Type", "application/json");
          res.writeHead(proxyRes.statusCode);
          res.end(data);
        });
      });

      proxyReq.on("error", (err) => {
        setCors();
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.setTimeout(360000, () => {
        proxyReq.destroy();
        setCors();
        res.writeHead(504, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Lyzr agent timed out after 6 minutes" }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // SERVE index.html for everything else
  const indexPath = path.join(__dirname, "index.html");
  fs.readFile(indexPath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end("Could not load index.html");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
  });

});

server.timeout = 400000;
server.keepAliveTimeout = 400000;
server.headersTimeout = 401000;

server.listen(PORT, () => {
  console.log("Lyzr Outreach Engine running on port " + PORT);
});
