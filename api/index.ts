import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';
import path from 'path';

// Create express app
const app = express();

// Middleware
app.use(express.json({
  verify: (req: any, _res: any, buf: any) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Register routes and serve static files
let initialized = false;

async function initializeApp() {
  if (!initialized) {
    // Register all routes
    await registerRoutes(app);
    
    // Serve static files in production
    try {
      serveStatic(app);
    } catch (error) {
      console.log('Could not serve static files, continuing...');
    }
    
    initialized = true;
  }
}

// Export as Vercel serverless function
export default async function handler(req: any, res: any) {
  await initializeApp();
  return app(req, res);
}
