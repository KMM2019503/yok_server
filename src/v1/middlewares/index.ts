import express, { type Application } from "express";
import httpLogger from "./http_logger";
import corsPolicy from "./cors_policy";

// apply every middleware
const applyMiddlewares = (app: Application) => {
  app.use(express.json());
  app.use(corsPolicy);
  app.use(httpLogger);

  // You can add more middlewares here
};

export default applyMiddlewares;
