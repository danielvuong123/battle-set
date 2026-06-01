import { query } from './db.js';

export async function upsertPlayer(id: string, name: string): Promise<void> {
  await query(
    `INSERT INTO players (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [id, name]
  );
}

export async function createRoomRecord(roomId: string): Promise<void> {
  await query(
    `INSERT INTO rooms (id, status) VALUES ($1, 'waiting')`,
    [roomId]
  );
}

export async function addPlayerToRoom(roomId: string, playerId: string): Promise<void> {
  await query(
    `INSERT INTO room_players (room_id, player_id, score)
     VALUES ($1, $2, 0) ON CONFLICT DO NOTHING`,
    [roomId, playerId]
  );
}

export async function markRoomPlaying(roomId: string): Promise<void> {
  await query(
    `UPDATE rooms SET status = 'playing' WHERE id = $1`,
    [roomId]
  );
}

export async function recordFoundSet(
  roomId: string,
  playerId: string,
  cardIds: string[]
): Promise<void> {
  await Promise.all([
    query(
      `UPDATE room_players SET score = score + 1
       WHERE room_id = $1 AND player_id = $2`,
      [roomId, playerId]
    ),
    query(
      `INSERT INTO found_sets (room_id, player_id, card_ids)
       VALUES ($1, $2, $3)`,
      [roomId, playerId, cardIds]
    ),
  ]);
}

export async function markRoomFinished(roomId: string): Promise<void> {
  await query(
    `UPDATE rooms SET status = 'finished', ended_at = now() WHERE id = $1`,
    [roomId]
  );
}

export async function getActiveRoomForPlayer(playerId: string): Promise<{
  roomId: string;
  status: string;
} | null> {
  const result = await query<{ id: string; status: string }>(
    `SELECT r.id, r.status FROM rooms r
     JOIN room_players rp ON rp.room_id = r.id
     WHERE rp.player_id = $1 AND r.status = 'playing'
     ORDER BY r.created_at DESC LIMIT 1`,
    [playerId]
  );
  if (!result.rows[0]) return null;
  return { roomId: result.rows[0].id, status: result.rows[0].status };
}

export async function getLeaderboard(limit = 10): Promise<{
  name: string;
  totalSets: number;
  gamesPlayed: number;
}[]> {
  const result = await query<{
    name: string;
    total_sets: string;
    games_played: string;
  }>(
    `SELECT p.name,
            COALESCE(SUM(rp.score), 0) AS total_sets,
            COUNT(DISTINCT rp.room_id)  AS games_played
     FROM players p
     LEFT JOIN room_players rp ON rp.player_id = p.id
     GROUP BY p.id, p.name
     ORDER BY total_sets DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(r => ({
    name: r.name,
    totalSets: Number(r.total_sets),
    gamesPlayed: Number(r.games_played),
  }));
}
