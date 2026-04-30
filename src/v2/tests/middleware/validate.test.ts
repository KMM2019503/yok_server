import { describe, expect, it } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../../shared/middleware/validate";
import { ValidationError } from "../../shared/errors";

const schema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

describe("validate middleware", () => {
  it("passes valid payload", () => {
    const middleware = validate(schema);

    const req = {
      body: { name: "Alice" },
      params: {},
      query: {},
    } as unknown as Request;

    const res = {} as Response;

    let nextError: unknown;
    const next: NextFunction = (error?: unknown) => {
      nextError = error;
    };

    middleware(req, res, next);

    expect(nextError).toBeUndefined();
  });

  it("returns validation error on invalid payload", () => {
    const middleware = validate(schema);

    const req = {
      body: { name: "" },
      params: {},
      query: {},
    } as unknown as Request;

    const res = {} as Response;

    let nextError: unknown;
    const next: NextFunction = (error?: unknown) => {
      nextError = error;
    };

    middleware(req, res, next);

    expect(nextError).toBeInstanceOf(ValidationError);
  });
});
