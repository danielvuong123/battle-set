import { useEffect, useState } from 'react';
import { socket, getPlayerId } from './socket';
import type { SetCard } from '../lib/set';

export type MPPlayer = {
  id: string;
  name: string;
  score: number;
};

export type ClaimFlash = {
  playerName: string;
  valid: boolean;
  cardIds: string[];
};

export type FoundSetEntry = {
  playerName: string;
  playerId: string;
  cards: SetCard[];
};

type GameState = {
  board: SetCard[];
  deckSize: number;
  scores: Record<string, number>;
  gameOver: boolean;
  winner: { id: string; name: string } | null;
  foundSets: FoundSetEntry[];
};

export function useMultiplayerGame(
  roomId: string,
  initialBoard: SetCard[] = [],
  initialDeckSize = 0,
) {
  const [game, setGame] = useState<GameState>({
    board: initialBoard,
    deckSize: initialDeckSize,
    scores: {},
    gameOver: false,
    winner: null,
    foundSets: [],
  });
  const [players, setPlayers] = useState<MPPlayer[]>([]);
  const [lastClaim, setLastClaim] = useState<ClaimFlash | null>(null);

  useEffect(() => {
    function onGameStarted({ board, deckSize }: { board: SetCard[]; deckSize: number }) {
      setGame(g => ({ ...g, board, deckSize }));
    }

    function onClaimResult(result: {
      valid: boolean;
      playerId: string;
      playerName: string;
      cardIds: string[];
      board?: SetCard[];
      deckSize?: number;
      scores?: Record<string, number>;
    }) {
      setLastClaim({ playerName: result.playerName, valid: result.valid, cardIds: result.cardIds });
      setTimeout(() => setLastClaim(null), 1500);

      if (result.valid && result.board && result.deckSize !== undefined && result.scores) {
        setGame(prev => {
          // capture cards from the current board before it updates
          const claimed = result.cardIds
            .map(id => prev.board.find(c => c.id === id))
            .filter((c): c is SetCard => c !== undefined);

          return {
            ...prev,
            board: result.board!,
            deckSize: result.deckSize!,
            scores: result.scores!,
            foundSets: [
              ...prev.foundSets,
              { playerName: result.playerName, playerId: result.playerId, cards: claimed },
            ],
          };
        });
        setPlayers(prev =>
          prev.map(p => ({ ...p, score: result.scores![p.id] ?? p.score }))
        );
      }
    }

    function onGameOver({ players: finalPlayers, winnerId, winnerName }: {
      players: MPPlayer[];
      winnerId: string;
      winnerName: string;
    }) {
      setPlayers(finalPlayers);
      setGame(g => ({ ...g, gameOver: true, winner: { id: winnerId, name: winnerName } }));
    }

    function onPlayerJoined({ player }: { player: MPPlayer }) {
      setPlayers(prev => [...prev, player]);
    }

    function onPlayerLeft({ playerId }: { playerId: string }) {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }

    socket.on('game_started', onGameStarted);
    socket.on('claim_result', onClaimResult);
    socket.on('game_over', onGameOver);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);

    return () => {
      socket.off('game_started', onGameStarted);
      socket.off('claim_result', onClaimResult);
      socket.off('game_over', onGameOver);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
    };
  }, [roomId]);

  function claimSet(cardIds: string[]) {
    socket.emit('claim_set', { roomId, cardIds, playerId: getPlayerId() });
  }

  return { game, players, lastClaim, claimSet, setPlayers };
}
