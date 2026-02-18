import proxy from "express-http-proxy";
import logger from "../../engine/libs/log";
import { checkAuth } from "../../engine/middleware/auth.middleware";
import { access } from "../../engine/config/users.cfg";
import { gui } from "../config/urls.cfg";

let _enabled = false;

export default function proxyServer() {
  const url = process.env.METRICS;
  if (!url) {
    _enabled = false;
    return [checkAuth(gui.root.login, access.admin)];
  }

  _enabled = true;
  return [
    // Check auth/redirect
    checkAuth(gui.root.login, access.admin),

    // Proxy to URL
    proxy(url, {
      proxyReqOptDecorator: (proxyReqOpts, req) => {
        proxyReqOpts.headers["X-WEBAUTH-USER"] = req.user?.username;
        return proxyReqOpts;
      },
      proxyErrorHandler: (err, res) => {
        logger.error(`Proxy Error: ${err}`);
        res
          .status(502)
          .send(`Proxy server at ${url} is currently unreachable.`);
      },
    }),
  ];
}

export const isEnabled = () => _enabled;
