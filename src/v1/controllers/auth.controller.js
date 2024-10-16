import * as authServices from "../services/auth.services.js";

export const login = async (req, res) => {
  try {
    const response = await authServices.login(req.body, res);
    res.status(201).json(response);
  } catch (error) {
    console.log("🚀 ~ login ~ error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const signUp = async (req, res) => {
  try {
    const response = await authServices.signUp(req.body, res);
    res.status(201).json(response);
  } catch (error) {
    console.log("��� ~ signUp ~ error:", error);
    res.status(500).json({ error: error.message });
  }
};
