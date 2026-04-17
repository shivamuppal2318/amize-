const http = require("http");
const httpProxy = require("http-proxy");

const TARGET_ORIGIN = process.env.DEV_PROXY_TARGET || "http://82.112.238.182:4001";
const PORT = Number(process.env.PORT || 4001);
const LOG = process.env.DEV_PROXY_LOG !== "0";

const proxy = httpProxy.createProxyServer({
  target: TARGET_ORIGIN,
  changeOrigin: true,
  ws: true,
  xfwd: true,
});

function now() {
  return new Date().toISOString();
}

function setCors(res, origin) {
  // Keep it permissive for local development.
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With, Accept, Origin"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
}

proxy.on("proxyRes", (proxyRes, req, res) => {
  const origin = req.headers.origin;
  setCors(res, origin);

  if (LOG) {
    const method = req.method || "GET";
    const path = req.url || "/";
    const status = proxyRes.statusCode || 0;
    console.log(
      `[dev-proxy] ${now()} ${method} ${path} -> ${status} (origin: ${
        origin || "-"
      })`
    );
  }
});

proxy.on("error", (err, req, res) => {
  if (LOG) {
    console.error(
      `[dev-proxy] ${now()} ERROR ${req?.method || "?"} ${req?.url || "?"}: ${
        err?.message || String(err)
      }`
    );
  }
  if (res && !res.headersSent) {
    res.writeHead(502, { "Content-Type": "application/json" });
  }
  if (res && res.end) {
    res.end(
      JSON.stringify({
        success: false,
        message: "Dev proxy error",
        error: err?.message || String(err),
      })
    );
  }
});

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  setCors(res, origin);

  if (req.method === "OPTIONS") {
    if (LOG) {
      console.log(
        `[dev-proxy] ${now()} OPTIONS ${req.url || "/"} -> 204 (origin: ${
          origin || "-"
        })`
      );
    }
    res.writeHead(204);
    res.end();
    return;
  }

  proxy.web(req, res, { target: TARGET_ORIGIN });
});

server.on("upgrade", (req, socket, head) => {
  // Socket.IO / WS upgrade passthrough
  if (LOG) {
    console.log(
      `[dev-proxy] ${now()} UPGRADE ${req.url || "/"} (origin: ${
        req.headers.origin || "-"
      })`
    );
  }
  proxy.ws(req, socket, head, { target: TARGET_ORIGIN });
});

server.on("clientError", (err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[dev-proxy] Listening on http://localhost:${PORT}`);
  console.log(`[dev-proxy] Proxying to ${TARGET_ORIGIN}`);
  console.log(
    `[dev-proxy] Logging: ${LOG ? "on" : "off"} (set DEV_PROXY_LOG=0 to disable)`
  );
});

