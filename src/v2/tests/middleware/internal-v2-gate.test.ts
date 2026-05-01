import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { internalV2Gate } from "../../shared/middleware/internal-v2-gate";

const createMockResponse = () => {
  let statusCode = 200;
  let jsonBody: unknown;

  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
  } as unknown as Response;

  return {
    response,
    getStatus: () => statusCode,
    getBody: () => jsonBody,
  };
};

describe("internalV2Gate", () => {
  const originalEnabled = env.V2_INTERNAL_ENABLED;
  const originalToken = env.V2_INTERNAL_TOKEN;

  beforeEach(() => {
    env.V2_INTERNAL_ENABLED = true;
    env.V2_INTERNAL_TOKEN = undefined;
  });

  afterEach(() => {
    env.V2_INTERNAL_ENABLED = originalEnabled;
    env.V2_INTERNAL_TOKEN = originalToken;
  });

  it("blocks requests when v2 is disabled", () => {
    env.V2_INTERNAL_ENABLED = false;

    const req = {
      header: () => undefined,
    } as unknown as Request;

    const { response, getStatus, getBody } = createMockResponse();
    let nextCalled = false;

    internalV2Gate(req, response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBeFalse();
    expect(getStatus()).toBe(404);
    expect(getBody()).toEqual({ message: "Not found" });
  });

  it("enforces token when configured", () => {
    env.V2_INTERNAL_TOKEN = "internal-token";

    const req = {
      header: () => "wrong-token",
    } as unknown as Request;

    const { response, getStatus, getBody } = createMockResponse();
    let nextCalled = false;

    internalV2Gate(req, response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBeFalse();
    expect(getStatus()).toBe(403);
    expect(getBody()).toEqual({ message: "Forbidden" });
  });

  it("allows request when enabled and token is valid", () => {
    env.V2_INTERNAL_TOKEN = "internal-token";

    const req = {
      header: () => "internal-token",
    } as unknown as Request;

    const { response } = createMockResponse();
    let nextCalled = false;

    internalV2Gate(req, response, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBeTrue();
  });
});
