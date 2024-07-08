import { defineStore } from 'pinia';
import { Game } from '@/game.interface';

const sampleGames: Game[] = [
  { id: 1, name: 'Catan', details: 'A strategy game of trade and resource management.', winners: [{ name: 'Oscar', date: '2021-10-01' }] },
  { id: 2, name: 'Risk', details: 'A classic game of military strategy.', winners: [{ name: 'Maria', date: '2021-10-02' }] },
  { id: 3, name: 'Monopoly', details: 'The famous real estate trading game.', winners: [{ name: 'John', date: '2021-10-03' }] },
  { id: 4, name: 'Scrabble', details: 'A word game where every letter counts.', winners: [{ name: 'Jane', date: '2021-10-04' }] },
  { id: 5, name: 'Chess', details: 'A two-player strategy board game.', winners: [{ name: 'Alice', date: '2021-10-05' }] },
  { id: 6, name: 'Blockus', details: 'A strategy game of blocking your opponents.', winners: [{ name: 'Bob', date: '2021-10-06' }] },
  { id: 7, name: 'Uno No Mercy', details: 'A card game of no mercy.', winners: [{ name: 'Eve', date: '2021-10-07' }] },
  { id: 8, name: 'Coup', details: 'A card game of deception.', winners: [{ name: 'Charlie', date: '2021-10-08' }] },
  { id: 9, name: 'Decodables', details: 'A card game of decoding.', winners: [{ name: 'David', date: '2021-10-09' }] }
  ]

export const useGamesStore = defineStore('games', {
  state: () => ({
    games: [
      ...sampleGames,
    ],
    nextId: sampleGames.length + 1
  }),
  getters: {
    getGameById: (state) => (id: number) => {
      return state.games.find(game => game.id === id);
    },
    getGameByName: (state) => (name: string) => {
      return state.games.find(game => game.name === name);
    }
  },
  actions: {
    addGame(game: any) {
      const newGame = {
        id: this.nextId++,  // Increment to ensure unique ID
        name: game.name,
        details: game.details,
        winners: game.winners || []  // Ensure winners is an array
      };

      this.games.push(newGame);
    },
    addWinner(gameName: string, winner: any) {
      const game = this.getGameByName(gameName);
      if (game) {
        game.winners.push(winner);
      }
    }
  }
});