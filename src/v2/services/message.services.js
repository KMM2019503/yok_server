import { messageServices } from "./message.services.ts";

export const sendDMMessageServiceV2 = (req) => {
  const userId = req?.userid ?? req?.headers?.userid;
  if (!userId) {
    throw new Error("Missing user id");
  }

  return messageServices.sendDirectMessage(userId, req.body);
};

export const sendDmMessageService = sendDMMessageServiceV2;

export const sendChannelInvitationService = (req) => {
  const userId = req?.userid ?? req?.headers?.userid;
  if (!userId) {
    throw new Error("Missing user id");
  }

  return messageServices.sendChannelInvitation(userId, req.body);
};

export const sendGroupMessageService = (req) => {
  const userId = req?.userid ?? req?.headers?.userid;
  if (!userId) {
    throw new Error("Missing user id");
  }

  return messageServices.sendGroupMessage(userId, req.body);
};

export const sendChannelMessageService = (req) => {
  const userId = req?.userid ?? req?.headers?.userid;
  if (!userId) {
    throw new Error("Missing user id");
  }

  return messageServices.sendChannelMessage(userId, req.body);
};

export const sendChannelMessageCommentService = (req) => {
  const userId = req?.userid ?? req?.headers?.userid;
  if (!userId) {
    throw new Error("Missing user id");
  }

  return messageServices.sendChannelComment(userId, req.body);
};
