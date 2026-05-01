import { Router } from "express";
import { registerRoutes } from "./register-routes";
import { errorHandler } from "../shared/middleware/error-handler";
import { requestLogger } from "../shared/middleware/request-logger";
import { internalV2Gate } from "../shared/middleware/internal-v2-gate";

export const createV2App = () => {
  const router = Router();

  router.use(internalV2Gate);
  router.use(requestLogger);

  registerRoutes(router);

  router.use(errorHandler);

  return router;
};
