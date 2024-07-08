import { defineStore } from 'pinia';
import { User, WonGame } from '../user.interface';
import { useGamesStore } from './games';

const sampleUsers: User[] = [
  { id: 1, name: 'Oscar', gamesWon: [{ name: 'Catan', date: '2021-10-01' }] },
  { id: 2, name: 'Maria', gamesWon: [{ name: 'Risk', date: '2021-10-02' }] },
  { id: 3, name: 'John', gamesWon: [{ name: 'Monopoly', date: '2021-10-03' }] },
  { id: 4, name: 'Jane', gamesWon: [{ name: 'Scrabble', date: '2021-10-04' }] },
  { id: 5, name: 'Alice', gamesWon: [{ name: 'Chess', date: '2021-10-05' }] },
  { id: 6, name: 'Bob', gamesWon: [{ name: 'Blockus', date: '2021-10-06' }] },
  { id: 7, name: 'Eve', gamesWon: [{ name: 'Uno No Mercy', date: '2021-10-07' }] },
  { id: 8, name: 'Charlie', gamesWon: [{ name: 'Coup', date: '2021-10-08' }] },
  { id: 9, name: 'David', gamesWon: [{ name: 'Decodables', date: '2021-10-09' }] }
];

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [
      ...sampleUsers,
    ],
    nextId: sampleUsers.length + 1
  }),
  getters: {
    getUserById: (state) => (id: number) => {
      return state.users.find(user => user.id === id);
    },
    getUserByUsername: (state) => (username: string) => {
      if (!username) return null; // Guard clause to handle null or undefined usernames
      return state.users.find(user => user.name.toLowerCase() === username.toLowerCase());
    }
  },
  actions: {
    addUser(username: string) {
      if (!username) return false; // Additional check to avoid undefined username
      const existingUser = this.getUserByUsername(username);
      if (!existingUser) {
        const newUser = { id: this.nextId++, name: username, gamesWon: [] };
        this.users.push(newUser);
        return true;
      }
      return false;
    },
    addGameWon(userId: number, gameWon: WonGame) {
      const user = this.getUserById(userId);
      if (user) {
        user.gamesWon.push(gameWon);

        // Update the games store to reflect this win
        const gamesStore = useGamesStore();
        gamesStore.addWinner(gameWon.name, { name: user.name, date: gameWon.date });
      }
    }
  }
});