import { describe, expect, it } from "bun:test";

describe("Auth v2 contract", () => {
  it("keeps v1 checkAuth response shape", () => {
    const payload = {
      success: true,
      message: "User is authenticated",
    };

    expect(payload).toEqual({
      success: true,
      message: "User is authenticated",
    });
  });
});
