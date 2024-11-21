import {
  addMemberToGroupService,
  createGroupService,
  findGroupByNameService,
  getAllGroupsService,
  getGroupMessageService,
  joinGroupService,
  leaveGroupService,
  removeMemberFromGroupService,
} from "../services/group.services.js";
import logger from "../utils/logger.js";

export const findGroupByName = async (req, res) => {
  try {
    const response = await findGroupByNameService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during Find Group By Name:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const response = await getAllGroupsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during get all group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const createGroup = async (req, res) => {
  try {
    const response = await createGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during create group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const response = await getGroupMessageService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during get group messages:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const response = await joinGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during join group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const response = await leaveGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during leave group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const addMember = async (req, res) => {
  try {
    const response = await addMemberToGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during add member to group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const removeMember = async (req, res) => {
  try {
    const response = await removeMemberFromGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during remove member from group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};
