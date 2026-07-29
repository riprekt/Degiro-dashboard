import fs from "node:fs/promises";
import path from "node:path";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

export function createStaticFileHandler(publicDirectory) {
  const publicRoot = path.resolve(publicDirectory);
  const publicPrefix = `${publicRoot}${path.sep}`;

  return async function serveStatic(pathname, response) {
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const resolvedPath = path.resolve(publicRoot, relativePath);

    if (
      resolvedPath !== path.join(publicRoot, "index.html") &&
      !resolvedPath.startsWith(publicPrefix)
    ) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const bytes = await fs.readFile(resolvedPath);
      response.writeHead(200, {
        "Content-Type":
          contentTypes[path.extname(resolvedPath)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy":
          "default-src 'self'; connect-src 'self'; img-src 'self' data:; " +
          "style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      });
      response.end(bytes);
    } catch (error) {
      if (error?.code === "ENOENT") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      throw error;
    }
  };
}
