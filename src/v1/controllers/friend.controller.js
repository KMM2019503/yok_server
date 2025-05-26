import logger from "../utils/logger.js";
import {
  sendFriendRequestService,
  acceptFriendRequestService,
  rejectFriendRequestService,
  cancelFriendRequestService,
  getFriendRequestsService,
  getFriendsListService,
  removeFriendService,
  searchUsersService,
  getOutgoingFriendRequestService,
} from "../services/firend.services.js";

export const searchUsers = async (req, res) => {
  try {
    const response = await searchUsersService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error during user search:", {
      error: error.message,
      query: req.query.query,
    });

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message,
      ...(error.statusCode ? {} : { details: "Internal server error" }),
    });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const response = await sendFriendRequestService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during sending friend request:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const response = await acceptFriendRequestService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during accepting friend request:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const response = await rejectFriendRequestService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during rejecting friend request:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const response = await cancelFriendRequestService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during canceling friend request:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const response = await getFriendRequestsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred while fetching friend requests:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getOutgoingFriendRequest = async (req, res) => {
  try {
    const response = await getOutgoingFriendRequestService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred while fetching outgoing requests:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const response = await getFriendsListService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred while fetching friends list:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const response = await removeFriendService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred while removing friend:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
