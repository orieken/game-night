// Define a type for WonGame
export type WonGame = {
  name: string;
  date: string; // Date
};

export type User = {
  id: number;
  name: string;
  gamesWon: WonGame[];
}
