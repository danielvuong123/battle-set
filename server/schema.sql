CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id         TEXT PRIMARY KEY,
  status     TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS room_players (
  room_id    TEXT REFERENCES rooms(id),
  player_id  UUID REFERENCES players(id),
  score      INT NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, player_id)
);

CREATE TABLE IF NOT EXISTS found_sets (
  id         BIGSERIAL PRIMARY KEY,
  room_id    TEXT REFERENCES rooms(id),
  player_id  UUID REFERENCES players(id),
  card_ids   TEXT[] NOT NULL,
  found_at   TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON players, rooms, room_players, found_sets TO battleset;
