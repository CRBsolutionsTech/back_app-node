import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = "seu_segredo_super_seguro";

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};