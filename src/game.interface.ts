export type Winner = {
  name: string;
  date: string; // Date
};

export type Game = {
  id: number;
  name: string;
  details: string;
  winners: Winner[];
}
