import { PrismaClient, Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Users
  const user1 = await prisma.user.create({
    data: {
      phone: "1234567890",
      userName: "john_doe",
      profilePictureUrl: "http://example.com/john.jpg",
      status: Status.ONLINE,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      phone: "0987654321",
      userName: "jane_doe",
      profilePictureUrl: "http://example.com/jane.jpg",
      status: Status.OFFLINE,
    },
  });

  // Seed Channel
  const channel1 = await prisma.channel.create({
    data: {
      name: "General",
      description: "General discussion",
      isPublic: true,
      createdById: user1.id,
      superAdminId: user1.id,
      adminIds: [user1.id],
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

  // Seed Messages in the Channel
  await prisma.message.create({
    data: {
      senderId: user1.id,
      content: "Hello, world!",
      channelId: channel1.id,
    },
  });

  await prisma.message.create({
    data: {
      senderId: user2.id,
      content: "Hi there!",
      channelId: channel1.id,
    },
  });

  // Seed a Conversation
  const conversation1 = await prisma.conversation.create({
    data: {
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

  // Seed Messages in the Conversation
  await prisma.message.create({
    data: {
      senderId: user1.id,
      content: "Hello, Jane!",
      conversationId: conversation1.id,
    },
  });

  await prisma.message.create({
    data: {
      senderId: user2.id,
      content: "Hi, John!",
      conversationId: conversation1.id,
    },
  });

  // Seed Contacts
  await prisma.contact.create({
    data: {
      userId: user1.id,
      contactId: user2.id,
    },
  });

  await prisma.contact.create({
    data: {
      userId: user2.id,
      contactId: user1.id,
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
