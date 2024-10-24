import {
  createContactService,
  createListContactsService,
  deleteContactService,
  getAllContactsService,
  updateContactService,
} from "../services/contact.services.js";
import logger from "../utils/logger.js";

export const getAllContacts = async (req, res) => {
  try {
    const response = await getAllContactsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch all contacts:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const response = await createContactService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during create contact:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const syncContacts = async (req, res) => {
  try {
    const response = await createListContactsService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during create list of contacts:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const response = await updateContactService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during update contacts:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const response = await deleteContactService(req);
    res.status(204).json(response);
  } catch (error) {
    logger.error("Error occurred during delete contact:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};
