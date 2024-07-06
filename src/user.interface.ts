// Define a type for WonGame
type WonGame = {
  gameName: string;
  date: Date;
};

class User {
  id: number;
  username: string;
  wonGames: WonGame[];

  constructor(id: number, username: string) {
    this.id = id;
    this.username = username;
    this.wonGames = [];
  }

  addWonGame(gameName: string, date: Date): void {
    this.wonGames.push({ gameName, date });
  }
}
