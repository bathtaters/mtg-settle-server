import type { RequestHandler } from "express";
import Server, { createProxyServer } from "http-proxy";
import logger from "../../engine/libs/log";
import { checkAuth } from "../../engine/middleware/auth.middleware";
import {
  normalizeError,
  sendAsHTML,
  sendAsJSON,
} from "../../engine/middleware/error.middleware";
import { access } from "../../engine/config/users.cfg";
import { gui } from "../config/urls.cfg";

// URL Prefixes
const apiPrefix = `${gui.admin.prefix}${gui.admin.metrics}/api`;

// Global proxy object
let proxy: Server | null = null;

export function proxyServer(): RequestHandler[] {
  const url = process.env.METRICS;
  if (!url) {
    proxy = null;
    return [checkAuth(gui.root.login, access.admin)];
  }

  // Configure proxy server
  proxy = createProxyServer({
    target: url,
    changeOrigin: true,
    ws: false,
  });

  // Global error handling for the proxy server
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
        if (req.url && req.url.startsWith(apiPrefix)) sendAsJSON(req, res);
        else sendAsHTML(req, res);
      },
    );
  });

  logger.verbose(`Forwarding HTTP requests to Grafana @ ${url}.`);
  return [
    // Check user authentication
    checkAuth(gui.root.login, access.admin),

    // Redirect requests to proxy
    (req, res) => {
      proxy?.web(req, res, {
        headers: {
          "X-WEBAUTH-USER": req.user?.username || "",
        },
      });
    },
  ];
}

/** Check if the proxy server is active */
export const isEnabled = () => proxy != null;
