// services/userService.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUser = async (data: { email: string; name?: string }) => {
  return await prisma.user.create({
    data,
  });
};

export const getUser = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const updateUser = async (
  id: string,
  data: Partial<{ email: string; name?: string }>
) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string) => {
  return await prisma.user.delete({
    where: { id },
  });
};
