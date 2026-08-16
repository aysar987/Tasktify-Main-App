# Deployment Tasktify ke VPS

## Arsitektur

```text
Browser
  ├─ /       -> Nginx -> 127.0.0.1:8101 -> Next.js
  └─ /api/*  -> Nginx -> 127.0.0.1:8102 -> Go API -> PostgreSQL
                                      └-> Supabase Auth validation
```

PostgreSQL hanya berada di Docker network dan tidak membuka port publik. Port publik VPS cukup `22`, `80`, dan `443`.

## SSH password atau key

Keduanya bisa. Workflow repository ini sengaja memakai SSH password melalui `sshpass`, jadi tidak wajib mengisi `VPS_SSH_KEY`.

Secrets wajib pada **kedua** repository:

```text
VPS_HOST
VPS_USER
VPS_PASSWORD
```

Password tidak boleh ditulis di workflow, commit, issue, atau log. Untuk hardening jangka panjang, SSH key dan user deploy non-root lebih disarankan; perpindahan ke key hanya memerlukan penggantian langkah konfigurasi SSH pada workflow.

## Secrets frontend

Repository `Tasktify-Main-App`:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://tasktify.id
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
VPS_HOST
VPS_USER
VPS_PASSWORD
```

## Secrets backend

Repository `TasktifyBE`:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
MIDTRANS_SERVER_KEY          # opsional jika baru memakai cash
MIDTRANS_IS_PRODUCTION=false
VPS_HOST
VPS_USER
VPS_PASSWORD
```

`POSTGRES_PASSWORD` tidak perlu dibuat di GitHub. Deployment backend pertama menghasilkan password acak di VPS dan menyimpannya pada `/srv/tasktify/backend-current/.env.production` dengan permission `600`.

## Urutan deployment pertama

1. Merge dan jalankan workflow backend lebih dulu.
2. Pastikan `http://127.0.0.1:8102/ready` sehat di VPS.
3. Merge dan jalankan workflow frontend.
4. Pastikan `/healthz`, halaman utama, dan `/api/health` sehat.

Source dan data produksi berada di:

```text
/srv/tasktify/source                 # frontend
/srv/tasktify/backend-current        # symlink release backend aktif
/srv/tasktify/backend-releases/      # release backend per commit SHA
/srv/tasktify/backups                # pg_dump harian, retensi 14 hari
Docker volume postgres_data          # database
Docker volume backend_uploads        # avatar
```

Jangan menjalankan `docker compose down -v` di produksi karena opsi `-v` menghapus database dan upload.

## Domain

Jika frontend langsung dari VPS, arahkan `tasktify.id` ke IP VPS. Nginx akan melayani frontend dan `/api/*` pada origin yang sama.

Jika frontend tetap di Vercel:

1. Arahkan DNS `api.tasktify.id` ke IP VPS.
2. Workflow frontend otomatis meminta dan memperbarui sertifikat HTTPS untuk `tasktify.id` dan `api.tasktify.id` melalui Certbot.
3. Secara default build Vercel menggunakan `https://api.tasktify.id`. Jika ingin memakai rewrite server-side, set environment Vercel:

```text
NEXT_PUBLIC_API_URL=/api
API_PROXY_URL=https://api.tasktify.id
```

Next.js akan me-rewrite `/api/*` ke API publik tanpa mengekspos token atau database credential.

## Pemeriksaan dan recovery

```bash
curl --fail http://127.0.0.1:8102/ready
curl --fail http://127.0.0.1:8101/
curl --fail http://127.0.0.1/api/health

docker compose --env-file /srv/tasktify/backend-current/.env.production \
  -p tasktify-backend ps

docker compose --env-file /srv/tasktify/source/.env.production \
  -p tasktify ps
```

Kedua deploy script menyimpan nama image sebelumnya dan melakukan rollback otomatis bila readiness check gagal. Backup manual dapat dibuat dengan:

```bash
sudo /srv/tasktify/backend-current/scripts/backup-postgres.sh
```
