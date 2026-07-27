CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SEQUENCE IF NOT EXISTS task_id_seq START 1050;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  rating DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  jobs INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  price_from INTEGER NOT NULL DEFAULT 0 CHECK (price_from >= 0),
  initials TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT ('TSK-' || nextval('task_id_seq')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  min_budget INTEGER NOT NULL DEFAULT 0 CHECK (min_budget >= 0),
  max_budget INTEGER NOT NULL CHECK (max_budget >= min_budget),
  schedule TIMESTAMPTZ NOT NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'ongoing', 'scheduled', 'history', 'cancelled')),
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  last_message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations(user_id, updated_at DESC);

INSERT INTO users (id, username, phone, email, password_hash, address, verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'guest.tasktify',
  '+6200000000001',
  NULL,
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  '',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO providers
  (id, name, title, category, location, rating, jobs, verified, price_from, initials)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Ari Staprans', 'Teknisi Listrik Senior', 'Listrik', 'Makassar', 4.9, 128, TRUE, 150000, 'AS'),
  ('10000000-0000-0000-0000-000000000002', 'Keisha Mahira', 'Electrical Engineer', 'Listrik', 'Jakarta Selatan', 4.8, 96, TRUE, 200000, 'KM'),
  ('10000000-0000-0000-0000-000000000003', 'Budi Santoso', 'Spesialis Plumbing', 'Plumbing', 'Jakarta Barat', 4.7, 211, TRUE, 125000, 'BS'),
  ('10000000-0000-0000-0000-000000000004', 'Nadia Putri', 'Teknisi AC & Cooling', 'AC', 'Tangerang', 4.9, 154, TRUE, 175000, 'NP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO banners (id, name, image)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Bantuan cepat untuk rumah Anda',
  '/banners/home-service.webp'
)
ON CONFLICT (id) DO NOTHING;
