// services/taskService.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createTask = async (data: {
  title: string;
  content: string;
  authorId: string;
}) => {
  return await prisma.task.create({
    data,
  });
};

export const getTask = async (id: string) => {
  return await prisma.task.findUnique({
    where: { id },
  });
};

export const updateTask = async (
  id: string,
  data: Partial<{ title: string; content: string }>
) => {
  return await prisma.task.update({
    where: { id },
    data,
  });
};

export const deleteTask = async (id: string) => {
  return await prisma.task.delete({
    where: { id },
  });
};
