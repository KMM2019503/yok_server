import { PrismaClient } from "@prisma/client";

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
      contactName: contact.contact.userName,
      // displayName: contact.displayName || contact.contact.userName,
      profilePictureUrl: contact.contact.profilePictureUrl,
      createdAt: contact.createdAt,
    })),
  };
};

export const createContactService = async (req) => {
  const { userid } = req.headers;
  // const { phoneNumber, displayName } = req.body;
  const { phoneNumber } = req.body;

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
      // displayName: displayName || null, // Optional display name
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

  // Step 1: Get all the phone numbers from user_contacts
  const phoneNumbers = user_contacts.map((contact) => contact.phone);

  // Step 2: Find all existing users in the database that match the phone numbers
  const existingUsers = await prisma.user.findMany({
    where: { phone: { in: phoneNumbers } },
  });

  // Step 3: Create a map of existing users by phone number for quick lookup
  const existingUsersMap = new Map(
    existingUsers.map((user) => [user.phone, user])
  );

  // Step 4: Filter out contacts whose users are not found in the database
  const filteredContacts = user_contacts.filter((contact) =>
    existingUsersMap.has(contact.phone)
  );

  // Step 5: Perform upsert operations concurrently using Promise.all
  const createdContacts = await Promise.all(
    filteredContacts.map(async (contactData) => {
      const { phone, name } = contactData;
      const contactUser = existingUsersMap.get(phone);

      // Upsert the contact
      return prisma.contact
        .upsert({
          where: {
            userId_contactId: {
              userId: userid,
              contactId: contactUser.id,
            },
          },
          update: {},
          create: {
            userId: userid,
            contactId: contactUser.id,
          },
        })
        .then((contact) => ({
          ...contact,
          phone: contactUser.phone,
          contactName: contactUser.userName,
        }));
    })
  );

  return {
    success: true,
    createdContacts,
    totalCreated: createdContacts.length,
  };
};

export const updateContactService = async (req) => {
  const { userid } = req.headers;
  const { contactId } = req.params;
  // const { displayName } = req.body;

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
    // data: {
    //   displayName: displayName || null,
    // },
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
