import { PrismaClient } from "@prisma/client";
import { updateContact } from "../controllers/contact.controller";

const prisma = new PrismaClient();

export const getAllContactsService = async (req) => {
  const { userid } = req.headers;

  // Validate the user
  const user = await prisma.user.findUnique({
    where: { id: userid },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Fetch all contacts for the user
  const contacts = await prisma.contact.findMany({
    where: { userId: userid },
    include: {
      contact: {
        select: {
          id: true,
          phone: true,
          userName: true,
          profilePictureUrl: true,
        },
      },
    },
  });

  return {
    success: true,
    contacts: contacts.map((contact) => ({
      id: contact.contact.id,
      phone: contact.contact.phone,
      displayName: contact.displayName || contact.contact.userName,
      profilePictureUrl: contact.contact.profilePictureUrl,
      createdAt: contact.createdAt,
    })),
  };
};

export const createContactService = async (req) => {
  const { userid } = req.headers;
  const { phoneNumber, displayName } = req.body;

  // Find the user who is adding the contact
  const user = await prisma.user.findUnique({
    where: { id: userid },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Find the contact user based on phone number
  const contactUser = await prisma.user.findUnique({
    where: { phone: phoneNumber },
  });

  if (!contactUser) {
    throw new Error("Contact not found");
  }

  // Check if the contact relationship already exists
  const existingContact = await prisma.contact.findUnique({
    where: {
      userId_contactId: {
        userId: userid,
        contactId: contactUser.id,
      },
    },
  });

  if (existingContact) {
    throw new Error("Contact already added");
  }

  // Create the contact relationship
  const newContact = await prisma.contact.create({
    data: {
      userId: userid,
      contactId: contactUser.id,
      displayName: displayName || null, // Optional display name
    },
  });

  return {
    success: true,
    contact: newContact,
  };
};

export const createListContactsService = async (req) => {
  const { userid } = req.headers;
  const { user_contacts } = req.body;

  if (!Array.isArray(user_contacts) || user_contacts.length === 0) {
    throw new Error("Invalid or empty contact list");
  }

  const user = await prisma.user.findUnique({
    where: { id: userid },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdContacts = [];

  for (const contactData of user_contacts) {
    const { phone, name } = contactData;

    const contactUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (!contactUser) {
      continue;
    }

    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: userid,
          contactId: contactUser.id,
        },
      },
    });

    if (existingContact) {
      continue;
    }

    const newContact = await prisma.contact.create({
      data: {
        userId: userid,
        contactId: contactUser.id,
        displayName: name || null,
      },
    });
    createdContacts.push(newContact);
  }

  return {
    success: true,
    createdContacts,
    totalCreated: createdContacts.length,
  };
};

export const updateContactService = async (req) => {
  const { userid } = req.headers;
  const { contactId } = req.params;
  const { displayName } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userid },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const contact = await prisma.contact.findUnique({
    where: {
      userId_contactId: {
        userId: userid,
        contactId: contactId,
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const updatedContact = await prisma.contact.update({
    where: {
      id: contact.id,
      userId: userid,
    },
    data: {
      displayName: displayName || null,
    },
  });

  return {
    success: true,
    contact: updatedContact,
  };
};

export const deleteContactService = async (req) => {
  const { userid } = req.headers;
  const { contactId } = req.params;

  // Validate the user
  const user = await prisma.user.findUnique({
    where: { id: userid },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if the contact exists and belongs to the user
  const contact = await prisma.contact.findUnique({
    where: {
      userId_contactId: {
        userId: userid,
        contactId: contactId,
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found or does not belong to the user");
  }

  // Delete the contact
  await prisma.contact.delete({
    where: {
      id: contact.id, // Delete using the contact ID
    },
  });

  return {
    success: true,
    message: "Contact deleted successfully",
    contact: contact,
  };
};
