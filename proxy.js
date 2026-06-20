module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const https = require("https");
  const body = JSON.stringify(req.body);

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

  try {
    const data = await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let raw = "";
        proxyRes.on("data", chunk => raw += chunk);
        proxyRes.on("end", () => {
          try {
            resolve({ status: proxyRes.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: proxyRes.statusCode, body: { response: raw } });
          }
        });
      });
      proxyReq.on("error", reject);
      proxyReq.write(body);
      proxyReq.end();
    });

    return res.status(data.status).json(data.body);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
