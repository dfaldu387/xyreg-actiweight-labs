import http from "http";

const ONLYOFFICE_URL = "http://193.219.97.116:8080";

export default function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extract path from original URL or query param
  let targetPath;
  if (req.query.path) {
    // Path passed via rewrite query param
    const otherParams = Object.entries(req.query)
      .filter(([key]) => key !== "path")
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join("&");
    targetPath = `/${req.query.path}${otherParams ? `?${otherParams}` : ""}`;
  } else {
    // Path from req.url
    targetPath = req.url.replace(/^\/api\/onlyoffice-proxy/, "").replace(/^\/api\/onlyoffice/, "") || "/";
  }

  const targetUrl = ONLYOFFICE_URL + targetPath;
  console.log("[Proxy]", req.method, targetUrl);

  const parsed = new URL(targetUrl);

  const proxyReq = http.request(
    {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: req.method,
      headers: {
        host: parsed.host,
        accept: req.headers.accept || "*/*",
      },
    },
    function (proxyRes) {
      // Rewrite Location header on redirects (302, 301, etc.)
      if (proxyRes.headers.location) {
        const newLocation = proxyRes.headers.location
          .replace(ONLYOFFICE_URL, "/api/onlyoffice")
          .replace("http://193.219.97.116:8080", "/api/onlyoffice");
        res.setHeader("Location", newLocation);
      }

      // Copy other useful headers
      if (proxyRes.headers["set-cookie"]) {
        res.setHeader("Set-Cookie", proxyRes.headers["set-cookie"]);
      }

      const chunks = [];
      proxyRes.on("data", function (chunk) {
        chunks.push(chunk);
      });
      proxyRes.on("end", function () {
        const buffer = Buffer.concat(chunks);
        const contentType = proxyRes.headers["content-type"] || "application/octet-stream";

        res.setHeader("Content-Type", contentType);

        if (
          contentType.includes("text") ||
          contentType.includes("javascript") ||
          contentType.includes("json") ||
          contentType.includes("html")
        ) {
          let body = buffer.toString("utf8");
          body = body.split(ONLYOFFICE_URL).join("/api/onlyoffice");
          res.status(proxyRes.statusCode).send(body);
        } else {
          res.status(proxyRes.statusCode).send(buffer);
        }
      });
    }
  );

  proxyReq.on("error", function (err) {
    console.error("[Proxy Error]", err.message);
    res.status(502).json({ error: "Proxy failed", message: err.message });
  });

  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    proxyReq.write(bodyStr);
  }

  proxyReq.end();
}
