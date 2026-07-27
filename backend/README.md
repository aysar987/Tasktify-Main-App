# Tasktify Backend

Backend Go ini terhubung langsung ke Supabase PostgreSQL menggunakan `pgxpool`.

## Supabase setup

1. Buka Supabase Dashboard, pilih project, lalu klik **Connect**.
2. Salin connection string:
   - Persistent host dengan IPv6: **Direct connection**.
   - Persistent host IPv4-only: **Session pooler** port `5432`.
   - Serverless/transient host: **Transaction pooler** port `6543`.
3. Salin `.env.example` menjadi `.env`.
4. Isi `DATABASE_URL` dan pastikan password sudah URL-encoded.
5. Untuk instalasi pertama, set `DB_AUTO_MIGRATE=true`, jalankan backend sekali,
   lalu ubah kembali ke `false`.

Contoh:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
DB_MAX_CONNS=10
DB_AUTO_MIGRATE=true
```

Alternatifnya, jalankan
`supabase/migrations/20260728000000_init_tasktify.sql` melalui Supabase SQL
Editor dan biarkan `DB_AUTO_MIGRATE=false`.

## GitHub integration

Repository ini menggunakan struktur Supabase CLI di `backend/supabase`.
Pada Supabase Dashboard → Integrations → GitHub, isi **Working directory**
dengan:

```text
backend
```

Jika **Deploy to production** diaktifkan, migration baru yang digabungkan ke
production branch akan diterapkan ke database production.

## Run

```bash
go run ./cmd/api
```

API tersedia di `http://localhost:4000/api/v1`.
