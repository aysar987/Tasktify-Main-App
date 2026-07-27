import app from "@/app";
import { env } from "@/config/env";

app.listen(env.port, () => {
  console.log(`🚀 Tasktify backend jalan di http://localhost:${env.port}`);
});