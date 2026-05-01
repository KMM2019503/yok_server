import type { RequestHandler } from "express";
import { env } from "../../config/env";

export const internalV2Gate: RequestHandler = (req, res, next) => {
  if (!env.V2_INTERNAL_ENABLED) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  if (env.V2_INTERNAL_TOKEN) {
    const provided = req.header("x-internal-v2-token");
    if (!provided || provided !== env.V2_INTERNAL_TOKEN) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
  }

  next();
};
