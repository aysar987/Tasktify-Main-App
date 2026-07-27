import jwt from "jsonwebtoken";
import { env } from "@/config/env";
export const signAccess = (payload: object) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: "15m" });
export const signRefresh = (payload: object) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "7d" });
export const verifyAccess = (t: string) => jwt.verify(t, env.jwtAccessSecret);
export const verifyRefresh = (t: string) => jwt.verify(t, env.jwtRefreshSecret);