import type { RequestHandler } from "express";
import { createProxyServer } from "http-proxy";
import logger from "../../engine/libs/log";
import { checkAuth } from "../../engine/middleware/auth.middleware";
import {
  normalizeError,
  sendAsHTML,
} from "../../engine/middleware/error.middleware";
import { access } from "../../engine/config/users.cfg";
import { gui } from "../config/urls.cfg";
import { IncomingMessage } from "http";
import Stream from "stream";

let proxyIsEnabled = false;
const url = process.env.METRICS;

const proxy = createProxyServer({
  target: url,
  changeOrigin: true,
  ws: true,
});

export function proxyServer(): RequestHandler[] {
  if (!url) {
    proxyIsEnabled = false;
    return [checkAuth(gui.root.login, access.admin)];
  }

  proxyIsEnabled = true;
  return [
    // Check user authentication
    checkAuth(gui.root.login, access.admin),

    // Redirect requests to proxy
    (req, res) => {
      proxy.web(req, res, {
        headers: {
          "X-WEBAUTH-USER": req.user?.username || "",
          Host: req.headers.host || "",
        },
      });
    },
  ];
}

/** Forward WebSockets (Server listener) */
export const handleUpgrade = (
  req: IncomingMessage,
  socket: Stream.Duplex,
  head: Buffer<ArrayBuffer>,
) => {
  // Handle forwarding for Grafana
  if (
    proxyIsEnabled &&
    req?.url &&
    req.url.startsWith(`${gui.admin.prefix}${gui.admin.metrics}/api/live/ws`)
  ) {
    proxy.ws(req, socket, head);
  }
};

/** Global error handling for the proxy */
proxy.on("error", (err, req, res) => {
  logger.error(`Proxy Error: ${err}`);
  normalizeError(
    {
      status: 502,
      name: "Proxy Error",
      message: `Via server at ${url}: ${err?.message || err || "Unknown error"}`,
      stack: err.stack,
    },
    req,
    res,
    () => {
      sendAsHTML(req, res);
    },
  );
});

/** Check if the proxy server is active */
export const isEnabled = () => proxyIsEnabled;
