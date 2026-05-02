import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

export const registerSwaggerDocs = (app: Express) => {
  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
};
