import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: viteLogger,
    server: serverOptions,
    appType: "custom",
  });

  // Vite middleware handles all module requests (/src/*, /node_modules/*, etc.)
  app.use(vite.middlewares);

  // Catch-all route for HTML pages (only for non-API, non-asset requests)
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith("/api")) {
      return next();
    }

    // Skip asset requests (Vite middleware handles these)
    if (url.startsWith("/src/") ||
      url.startsWith("/node_modules/") ||
      url.startsWith("/@") ||
      url.includes(".") && !url.endsWith(".html")) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // The build output is in dist/ directory at the project root
  const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  log(`✅ Serving static files from: ${distPath}`);

  // Serve static assets with proper cache headers
  // Hashed files (JS, CSS) can be cached forever since filenames change on rebuild
  // HTML and non-hashed files get short cache to ensure updates are picked up
  app.use(express.static(distPath, {
    maxAge: '1d', // Default: 1 day cache
    etag: true,
    setHeaders: (res, filePath) => {
      // HTML files: no cache to always get latest
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Hashed assets (contain fingerprint in name): cache for 1 year
      else if (filePath.match(/\.[a-f0-9]{8}\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Other assets: cache for 1 day
      else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res, next) => {
    // Skip the HTML fallback for API routes
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    // Set no-cache for HTML to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
