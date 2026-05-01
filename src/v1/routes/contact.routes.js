import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import {
  createContact,
  deleteContact,
  getAllContacts,
  syncContacts,
  updateContact,
} from "../controllers/contact.controller";
const router = Router();

// get all contacts
router.get("/", checkToken, getAllContacts);

// get contact by id
// router.get("/", checkToken, getAllContacts);

// create a new contact
router.post("/", checkToken, createContact);

// create list of contacts
router.post("/sync-contacts", checkToken, syncContacts);

// update contact information
router.put("/:contactId", checkToken, updateContact);

// delete contact
router.delete("/:contactId", checkToken, deleteContact);

export default router;
