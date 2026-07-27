# Tasktify Supabase Backend

Backend Tasktify sepenuhnya menggunakan Supabase:

- PostgreSQL + migration di `supabase/migrations`
- Row Level Security untuk Data API
- Edge Function TypeScript di `supabase/functions`
- Supabase Auth siap diaktifkan kembali saat UI auth dibuka

Tidak ada server Go atau server backend terpisah yang perlu dijalankan.

## Dashboard setup

Di Supabase Dashboard → Integrations → GitHub:

```text
Working directory: backend
```

Aktifkan **Deploy to production** jika migration dan Edge Function harus
diterapkan otomatis setelah merge ke branch production.

Untuk Edge Function `tasks`, tambahkan secret:

```text
ALLOWED_ORIGINS=https://tasktify.id,https://www.tasktify.id
```

`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia otomatis pada hosted
Edge Functions. Jangan menaruh service role key di frontend atau Git.

## Local development

Pasang Supabase CLI, lalu dari folder `backend`:

```bash
supabase start
supabase db reset
supabase functions serve tasks --env-file supabase/.env.local
```

File `supabase/.env.local` hanya diperlukan untuk custom secret lokal dan
tidak boleh di-commit.
