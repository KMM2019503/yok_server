import { describe, expect, it } from "bun:test";
import { buildLegacyRequest } from "../../shared/legacy/legacy-request";

describe("buildLegacyRequest", () => {
  it("maps auth user into both headers.userid and userid", () => {
    const request = buildLegacyRequest({
      userId: "user-1",
      body: { test: true },
      params: { id: "1" },
      query: { take: "10" },
    });

    expect(request.userid).toBe("user-1");
    expect(request.headers.userid).toBe("user-1");
    expect(request.body).toEqual({ test: true });
    expect(request.params).toEqual({ id: "1" });
    expect(request.query).toEqual({ take: "10" });
  });
});
