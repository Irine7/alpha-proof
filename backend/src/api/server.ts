import cors from "cors";
import express from "express";
import { getAgentStats, getLatestSignals, getSignalById } from "../db/signals.js";
import { createDemoSignal } from "../agent/orchestrator.js";
import { resolvePendingDemoSignals } from "../agent/evaluators/demoEvaluator.js";
import type { DemoEventKind } from "../types.js";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "alphaproof-backend" });
  });

  app.get("/api/signals", async (_req, res, next) => {
    try {
      res.json(await getLatestSignals());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/signals/:id", async (req, res, next) => {
    try {
      const signal = await getSignalById(Number(req.params.id));
      if (!signal) {
        res.status(404).json({ error: "Signal not found" });
        return;
      }
      res.json(signal);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/agent/stats", async (_req, res, next) => {
    try {
      res.json(await getAgentStats());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/create-signal", async (req, res, next) => {
    try {
      const result = await createDemoSignal(req.body?.kind as DemoEventKind | undefined);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/resolve-pending", async (_req, res, next) => {
    try {
      const results = await resolvePendingDemoSignals();
      res.json({ resolved: results.length, results });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  });

  return app;
}
