# Tasktify Frontend

Frontend-only Tasktify berbasis Next.js 16, React 19, dan TypeScript. Aplikasi berada di `frontend/` agar tetap kompatibel dengan Root Directory Vercel yang sudah aktif. Repository ini tidak menyimpan migration, database query, Edge Function, atau kode backend.

Supabase SDK hanya dipakai untuk sign-up, sign-in, reset password, dan session. Seluruh data aplikasi diakses melalui REST API Go dari repository `aysar987/TasktifyBE`.

## Menjalankan lokal

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Konfigurasi minimum:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Validasi:

```bash
npm run lint
npm run typecheck
npm run build
```

## Produksi

Docker image memakai Next.js standalone output. GitHub Actions melakukan lint, type-check, build, mengirim image ke VPS, lalu menjalankan readiness check dan rollback bila deployment gagal.

Di VPS, browser menggunakan `NEXT_PUBLIC_API_URL=/api`. Nginx meneruskan `/api/*` ke backend di `127.0.0.1:8102` dan frontend tetap berada di `127.0.0.1:8101`.

Build Vercel tanpa `NEXT_PUBLIC_API_URL` otomatis memakai `https://api.tasktify.id`. `API_PROXY_URL` tetap dapat dipakai jika deployment ingin meneruskan `/api/*` melalui rewrite server-side Vercel.
