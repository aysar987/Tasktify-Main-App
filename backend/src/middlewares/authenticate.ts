import { Request, Response, NextFunction } from "express";
import { verifyAccess } from "@/utils/token";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ success: false, error: "No token" });
  try {
    (req as any).user = verifyAccess(token);
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};