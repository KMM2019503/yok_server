import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      phone: "1234567890",
      userName: "john_doe",
      profilePictureUrl: "http://example.com/john.jpg",
      status: "ONLINE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      phone: "0987654321",
      userName: "jane_doe",
      profilePictureUrl: "http://example.com/jane.jpg",
      status: "OFFLINE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Seed Channels
  const channel1 = await prisma.channel.create({
    data: {
      name: "General",
      description: "General discussion",
      isPublic: true,
      adminId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    },
  });

  // Seed Channel Members
  await prisma.channelMember.create({
    data: {
      userId: user1.id,
      channelId: channel1.id,
      joinedAt: new Date(),
    },
  });

  await prisma.channelMember.create({
    data: {
      userId: user2.id,
      channelId: channel1.id,
      joinedAt: new Date(),
    },
  });

  // Seed Messages in Channel
  await prisma.message.create({
    data: {
      senderId: user1.id,
      content: "Hello, world!",
      channelId: channel1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      senderId: user2.id,
      content: "Hi there!",
      channelId: channel1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Seed Conversation
  const conversation1 = await prisma.conversation.create({
    data: {
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
    },
  });

  // Seed Conversation Members
  await prisma.conversationMember.create({
    data: {
      userId: user1.id,
      conversationId: conversation1.id,
      joinedAt: new Date(),
    },
  });

  await prisma.conversationMember.create({
    data: {
      userId: user2.id,
      conversationId: conversation1.id,
      joinedAt: new Date(),
    },
  });

  // Seed Messages in Conversation
  await prisma.message.create({
    data: {
      senderId: user1.id,
      content: "Hello, Jane!",
      conversationId: conversation1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      senderId: user2.id,
      content: "Hi, John!",
      conversationId: conversation1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Seed Contacts
  await prisma.contact.create({
    data: {
      userId: user1.id,
      contactId: user2.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.contact.create({
    data: {
      userId: user2.id,
      contactId: user1.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
