type Winner = {
  user: User;
  date: Date;
};

class Game {
  id: number;
  name: string;
  details: string;
  winners: Winner[];

  constructor(id: number, name: string, details: string) {
    this.id = id;
    this.name = name;
    this.details = details;
    this.winners = [];
  }

  addWinner(user: User, date: Date): void {
    this.winners.push({ user, date });
  }
}
