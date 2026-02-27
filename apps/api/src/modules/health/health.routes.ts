import { Router } from "express";

export const createHealthRouter = (): Router => {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};

