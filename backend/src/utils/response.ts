import { Response } from "express";

export const ok = (res: Response, data: unknown, message = "OK") =>
  res.json({ success: true, message, data });

export const fail = (res: Response, status: number, error: string, code?: string) =>
  res.status(status).json({ success: false, error, code });