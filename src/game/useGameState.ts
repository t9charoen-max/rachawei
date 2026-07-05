import { useCallback, useState } from 'react';
import { compareCards, createDeck, dealCards, shuffleDeck } from './cards';
import type { GamePhase, GameState, Player } from './types';

function createPlayer(name: string): Player {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    card: null,
    hasSwapped: false,
  };
}

const initialState: GameState = {
  phase: 'home',
  players: [],
  currentPlayerIndex: 0,
  countdown: 3,
  kingId: null,
  traitorId: null,
  selectedPunishment: null,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const goTo = useCallback((phase: GamePhase) => {
    setState((s) => ({ ...s, phase }));
  }, []);

  const addPlayer = useCallback((name: string) => {
    if (!name.trim()) return;
    setState((s) => {
      if (s.players.length >= 10) return s;
      return { ...s, players: [...s.players, createPlayer(name)] };
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
    }));
  }, []);

  const startGame = useCallback(() => {
    setState((s) => {
      if (s.players.length < 3) return s;
      const cards = dealCards(s.players.length);
      const players = s.players.map((p, i) => ({ ...p, card: cards[i], hasSwapped: false }));
      return {
        ...s,
        phase: 'dealing',
        players,
        currentPlayerIndex: 0,
        kingId: null,
        traitorId: null,
        selectedPunishment: null,
      };
    });
  }, []);

  const finishDealing = useCallback(() => {
    setState((s) => ({ ...s, phase: 'bluff', currentPlayerIndex: 0 }));
  }, []);

  const keepCard = useCallback(() => {
    setState((s) => {
      const next = s.currentPlayerIndex + 1;
      if (next >= s.players.length) {
        return { ...s, phase: 'countdown', countdown: 3, currentPlayerIndex: 0 };
      }
      return { ...s, currentPlayerIndex: next };
    });
  }, []);

  const swapCard = useCallback(() => {
    setState((s) => {
      const player = s.players[s.currentPlayerIndex];
      if (!player || player.hasSwapped) return s;

      const usedKeys = new Set(
        s.players
          .map((p) => (p.card ? `${p.card.suit}-${p.card.rank}` : null))
          .filter((k): k is string => k !== null),
      );
      const remaining = shuffleDeck(createDeck()).filter(
        (c) => !usedKeys.has(`${c.suit}-${c.rank}`),
      );
      const newCard = remaining[0];
      if (!newCard) return s;

      const players = s.players.map((p, i) =>
        i === s.currentPlayerIndex ? { ...p, card: newCard, hasSwapped: true } : p,
      );

      const next = s.currentPlayerIndex + 1;
      if (next >= players.length) {
        return { ...s, players, phase: 'countdown', countdown: 3, currentPlayerIndex: 0 };
      }
      return { ...s, players, currentPlayerIndex: next };
    });
  }, []);

  const tickCountdown = useCallback(() => {
    setState((s) => {
      if (s.countdown <= 1) {
        return { ...s, phase: 'reveal', countdown: 0 };
      }
      return { ...s, countdown: s.countdown - 1 };
    });
  }, []);

  const determineRoles = useCallback(() => {
    setState((s) => {
      const withCards = s.players.filter((p) => p.card);
      if (withCards.length === 0) return s;

      let king = withCards[0];
      let traitor = withCards[0];

      for (const p of withCards) {
        if (!king.card || !p.card) continue;
        if (!traitor.card) continue;

        if (compareCards(p.card, king.card) > 0) king = p;
        if (compareCards(p.card, traitor.card) < 0) traitor = p;
      }

      return {
        ...s,
        phase: 'punishment',
        kingId: king.id,
        traitorId: traitor.id,
      };
    });
  }, []);

  const selectPunishment = useCallback((punishment: string) => {
    setState((s) => ({ ...s, selectedPunishment: punishment, phase: 'result' }));
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState);
  }, []);

  const playAgain = useCallback(() => {
    setState((s) => ({
      ...initialState,
      phase: 'setup',
      players: s.players.map((p) => ({ ...p, card: null, hasSwapped: false })),
    }));
  }, []);

  return {
    state,
    goTo,
    addPlayer,
    removePlayer,
    startGame,
    finishDealing,
    keepCard,
    swapCard,
    tickCountdown,
    determineRoles,
    selectPunishment,
    resetGame,
    playAgain,
  };
}
