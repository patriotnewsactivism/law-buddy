// Vercel serverless function entry point
import express from "express";
import { registerRoutes } from "../server/routes";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(express.urlencoded({ extended: false }));

// Register all routes
let routesRegistered = false;

const initializeApp = async () => {
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const distPath = path.resolve(__dirname, '../dist/public');
    
    app.use(express.static(distPath));
    
    app.use('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
};

// Initialize the app
initializeApp();

export default app;
