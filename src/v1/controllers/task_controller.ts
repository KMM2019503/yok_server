import { type Request, type Response } from "express";
import * as taskService from "../services/task_services";

export const createTask = async (req: Request, res: Response) => {
  try {
    const newtask = await taskService.createTask(req.body);
    res.status(201).json(newtask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const task = await taskService.getTask(id);
    if (!task) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedtask = await taskService.updateTask(id, req.body);
    res.json(updatedtask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await taskService.deleteTask(id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
