import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";        // 🔄 BARU
import routes from "@/routes";
import { errorHandler } from "@/middlewares/errorHandler";
import { env } from "@/config/env";

const app = express();

app.use(helmet());

// 🔄 CORS harus spesifik ke domain web + credentials true (wajib untuk cookie)
app.use(cors({
  origin: [env.clientUrl],       // domain Next.js; tambah domain produksi nanti
  credentials: true,             // izinkan browser kirim & terima cookie
}));

app.use(express.json());
app.use(cookieParser());         // 🔄 BARU: supaya req.cookies terbaca

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(errorHandler);           // harus paling akhir

export default app;