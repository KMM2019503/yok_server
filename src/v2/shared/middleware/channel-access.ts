import type { RequestHandler } from "express";
import prisma from "../db/prisma";

export const requireSuperAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const channelId = req.params.channelId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!channelId) {
      res.status(400).json({ message: "Channel ID is required" });
      return;
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, superAdminId: true, adminIds: true },
    });

    if (!channel) {
      res.status(404).json({ message: "Channel not found" });
      return;
    }

    if (channel.superAdminId !== userId) {
      res.status(403).json({ message: "Access denied: Not a super admin" });
      return;
    }

    req.channelId = channelId;
    req.channel = channel;

    next();
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requireChannelAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    const maybeBody =
      typeof req.body === "object" && req.body !== null
        ? (req.body as { channelId?: string })
        : {};
    const channelId = maybeBody.channelId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!channelId) {
      res.status(400).json({ message: "Channel ID is required" });
      return;
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, superAdminId: true, adminIds: true },
    });

    if (!channel) {
      res.status(404).json({ message: "Channel not found" });
      return;
    }

    const isAdmin = channel.superAdminId === userId || channel.adminIds.includes(userId);

    if (!isAdmin) {
      res.status(403).json({ message: "Access denied: Not an admin or super admin" });
      return;
    }

    req.channel = channel;

    next();
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};
