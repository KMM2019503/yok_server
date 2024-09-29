import { type Request, type Response } from "express";
import * as userService from "../services/user_services";

export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await userService.getUser(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedUser = await userService.updateUser(id, req.body);
    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await userService.deleteUser(id);
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
