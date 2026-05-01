import { describe, expect, it } from "bun:test";
import { withMessage } from "../../modules/channels/channels.mapper";

describe("Channels v2 contract", () => {
  it("matches v1 wrapped response envelope for admin mutation", () => {
    const payload = withMessage("Admin added successfully", {
      success: true,
      channel: { id: "c1" },
    });

    expect(payload).toEqual({
      message: "Admin added successfully",
      data: {
        success: true,
        channel: { id: "c1" },
      },
    });
  });

  it("matches v1 wrapped response envelope for channel deletion", () => {
    const payload = withMessage("Channel deleted successfully", {
      success: true,
      channel: { id: "c1" },
    });

    expect(payload).toEqual({
      message: "Channel deleted successfully",
      data: {
        success: true,
        channel: { id: "c1" },
      },
    });
  });
});
