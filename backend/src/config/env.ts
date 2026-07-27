import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL!,
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  redisUrl: process.env.REDIS_URL!,
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY!,
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY!,
};

export const isProd = env.nodeEnv === "production";