import type { Channel } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
      userid?: string;
      channelId?: string;
      channel?: Pick<Channel, "id" | "superAdminId" | "adminIds">;
    }
  }
}

export {};
