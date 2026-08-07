Yes. I inspected this project: it deploys the Next.js frontend and Go backend with Docker Compose, exposes them on ports `8001/8002`, routes domains through Nginx, and deploys from GitHub Actions with readiness checks and rollback.

For a new dedicated VPS, I recommend the same architecture but slightly simpler:

```text
Internet
   │
   ├─ project.com ───────► Host Nginx ─► 127.0.0.1:8101 ─► Frontend container
   └─ api.project.com ───► Host Nginx ─► 127.0.0.1:8102 ─► Backend container
                                                    └─────► Redis/Database
```

Only ports `22`, `80`, and `443` should be public.

The following assumes Ubuntu 24.04 LTS.

## 1. Access and prepare the VPS

Get the IP address and SSH credentials from Rumahweb Clientzone or the provisioning email. Rumahweb VPS products may use either a root password or an SSH key.

From PowerShell:

```powershell
ssh root@YOUR_VPS_IP
```

On the VPS:

```bash
apt update
apt full-upgrade -y

apt install -y \
  ca-certificates \
  curl \
  nginx \
  ufw \
  fail2ban \
  unattended-upgrades

timedatectl set-timezone Asia/Jakarta

adduser deploy
usermod -aG sudo deploy
```

Ubuntu supports automatic daily security updates through `unattended-upgrades`. [Ubuntu security guidance](https://ubuntu.com/server/docs/explanation/security/security_suggestions/)

## 2. Configure SSH keys

On your local Windows machine:

```powershell
ssh-keygen -t ed25519 -C "my-vps"
```

Copy the public key:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | ssh root@YOUR_VPS_IP "install -d -m 700 -o deploy -g deploy /home/deploy/.ssh && tee /home/deploy/.ssh/authorized_keys >/dev/null && chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys"
```

Test it in a new terminal:

```powershell
ssh deploy@YOUR_VPS_IP
sudo -v
```

Keep the original root session open while testing. Only after the new login works, create:

```bash
sudoedit /etc/ssh/sshd_config.d/00-hardening.conf
```

Contents:

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
```

Validate and reload:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

## 3. Enable the firewall

Run this before closing your working SSH connection:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

sudo ufw enable
sudo ufw status verbose
```

If Rumahweb provides an additional network firewall/security group, allow TCP `22`, `80`, and `443` there too. Ubuntu uses UFW as its standard simple firewall interface. [Ubuntu firewall documentation](https://documentation.ubuntu.com/server/how-to/security/firewalls/)

## 4. Install Docker and Compose

Use Docker’s official Ubuntu repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL \
  https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update

sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

These commands follow Docker’s current [Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/).

Do not publish application containers as `0.0.0.0:8101` or `0.0.0.0:8102`. Docker documents that published container ports can bypass UFW rules. Bind them explicitly to `127.0.0.1`. [Docker firewall warning](https://docs.docker.com/engine/install/ubuntu/)

## 5. Create deployment directories

```bash
sudo mkdir -p /srv/myproject/frontend
sudo mkdir -p /srv/myproject/backend
sudo chown -R deploy:deploy /srv/myproject
```

Suggested layout:

```text
/srv/myproject/
├── frontend/
│   ├── Dockerfile
│   ├── compose.yaml
│   └── .env.production
└── backend/
    ├── Dockerfile
    ├── compose.yaml
    ├── .env
    └── backups/
```

## 6. Frontend Compose file

Example `/srv/myproject/frontend/compose.yaml`:

```yaml
services:
  frontend:
    image: myproject-frontend:${FRONTEND_IMAGE_TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      HOSTNAME: 0.0.0.0
      PORT: 3000
    ports:
      - "127.0.0.1:8101:3000"
    restart: unless-stopped
```

For Next.js, use `output: "standalone"` and a multistage Dockerfile like this project’s [Dockerfile](C:/Users/asus/OneDrive/Desktop/Repo-Front-End/Dockerfile:1).

Important: `NEXT_PUBLIC_*` and Vite’s `VITE_*` variables normally become part of the browser bundle during the build. Supplying them only at container runtime may be too late. Never put database passwords or private API keys in public frontend variables.

## 7. Backend Compose file

Adapt the internal application port to your backend. Example:

```yaml
services:
  backend:
    image: myproject-backend:${BACKEND_IMAGE_TAG:-latest}
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
    environment:
      PORT: 8080
      REDIS_URL: redis://redis:6379/0
    ports:
      - "127.0.0.1:8102:8080"
    volumes:
      - backend_uploads:/app/uploads
      - ./backups:/backups
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  redis:
    image: redis:7.4-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

volumes:
  backend_uploads:
  redis_data:
```

Redis and databases should not have public `ports:` entries.

If frontend server-side rendering must contact the backend directly, connect both Compose projects through an explicit external network instead of relying on matching Compose project names. Docker documents this as the supported approach for [connecting multiple Compose projects](https://docs.docker.com/compose/how-tos/networking/).

## 8. Configure production environment files

Frontend:

```bash
nano /srv/myproject/frontend/.env.production
chmod 600 /srv/myproject/frontend/.env.production
```

Example:

```env
NEXT_PUBLIC_API_URL_PROD=https://api.project.com
NEXT_PUBLIC_SITE_URL=https://project.com
```

Backend:

```bash
nano /srv/myproject/backend/.env
chmod 600 /srv/myproject/backend/.env
```

Example:

```env
APP_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
ALLOWED_ORIGINS=https://project.com,https://www.project.com
PUBLIC_API_URL=https://api.project.com
```

Do not commit these production files.

## 9. Start the applications

Backend first:

```bash
cd /srv/myproject/backend
sudo docker compose -p myproject-backend config
sudo docker compose -p myproject-backend up -d --build
sudo docker compose -p myproject-backend ps
curl --fail http://127.0.0.1:8102/health
```

Frontend:

```bash
cd /srv/myproject/frontend
sudo docker compose -p myproject-frontend config
sudo docker compose -p myproject-frontend up -d --build
sudo docker compose -p myproject-frontend ps
curl --fail http://127.0.0.1:8101/
```

Use different Compose project names. The current repositories both use `group1`; that was useful for their shared VPS arrangement but is unnecessary on your own server.

## 10. Point your domains to the VPS

In Rumahweb DNS Management:

| Type | Name | Value |
|---|---|---|
| A | `@` | `YOUR_VPS_IP` |
| CNAME | `www` | `project.com` |
| A | `api` | `YOUR_VPS_IP` |

Rumahweb explains this process in its [domain-to-VPS guide](https://www.rumahweb.com/journal/cara-menghubungkan-domain-ke-vps/). Propagation can take several minutes to 24–48 hours.

Verify:

```bash
dig +short project.com
dig +short api.project.com
```

Both should return the VPS IP before requesting SSL certificates.

## 11. Configure host Nginx

Create:

```bash
sudo nano /etc/nginx/sites-available/myproject
```

Contents:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name project.com www.project.com;

    location / {
        proxy_pass http://127.0.0.1:8101;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    listen [::]:80;

    server_name api.project.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8102;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/myproject \
  /etc/nginx/sites-enabled/myproject

sudo nginx -t
sudo systemctl reload nginx
```

## 12. Add HTTPS

Install Certbot:

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
```

Request the certificate:

```bash
sudo certbot --nginx \
  -d project.com \
  -d www.project.com \
  -d api.project.com
```

Test automatic renewal:

```bash
sudo certbot renew --dry-run
```

Certbot recommends its snap installation and automatically configures renewal. [Official Certbot instructions](https://certbot.eff.org/instructions?os=snap&ws=nginx)

## 13. Configure GitHub Actions

Generate a separate CI deployment key locally:

```powershell
ssh-keygen `
  -t ed25519 `
  -f "$env:USERPROFILE\.ssh\myproject_github" `
  -C "github-actions-myproject"
```

Append its public key to the VPS:

```powershell
Get-Content "$env:USERPROFILE\.ssh\myproject_github.pub" | ssh deploy@YOUR_VPS_IP "umask 077; tee -a ~/.ssh/authorized_keys >/dev/null"
```

Add these secrets to both GitHub repositories:

```text
VPS_HOST       = VPS IP
VPS_USER       = deploy
VPS_SSH_KEY    = contents of myproject_github private key
```

GitHub recommends keeping credentials in Actions secrets and using least-privilege deployment credentials. [GitHub Actions secrets](https://docs.github.com/en/actions/reference/security/secrets)

Because your workflow uses `sudo docker`, allow that command without an interactive password:

```bash
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/docker' \
  | sudo tee /etc/sudoers.d/deploy-docker

sudo chmod 440 /etc/sudoers.d/deploy-docker
sudo visudo -cf /etc/sudoers.d/deploy-docker
```

Adapt this project’s workflows:

- [Frontend workflow](C:/Users/asus/OneDrive/Desktop/Repo-Front-End/.github/workflows/deploy-production.yml:1)
- [Backend workflow](C:/Users/asus/OneDrive/Desktop/Repo-Back-End/.github/workflows/deploy-production.yml:1)

Change these values:

| Current project | New project |
|---|---|
| `$HOME/app` | `/srv/myproject/frontend` |
| `$HOME/backend` | `/srv/myproject/backend` |
| `group1` | `myproject-frontend` / `myproject-backend` |
| Port `8001` | Port `8101` |
| Port `8002` | Port `8102` |
| BEM domains | Your new domains |
| BEM image names | Your new image names |
| `/ready` or `/health` | Your backend health endpoint |

Keep the existing good behaviors: tests before deployment, images tagged with commit SHA, migrations before backend replacement, readiness checks, upload/database backups, and rollback to the last successful image.

Finally, verify:

```bash
curl --fail https://project.com
curl --fail https://api.project.com/health

sudo docker compose -p myproject-frontend ps
sudo docker compose -p myproject-backend ps

sudo nginx -t
sudo ufw status
```

Do not run `docker compose down -v` in production; `-v` deletes named volumes such as uploads, Redis data, or a local database.