export interface Player {
  username: string;
  points: number;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  gameCode: string;
  players: Player[];
  rounds: number;
  started: boolean;
  intervalId: NodeJS.Timeout | null;
  buttonPressed: boolean;
  currentPlayer: Player | null;
  round: number;
}

export interface JoinCreateGameData {
  gameCode: string | null;
  username: string;
}

export interface RoomOfGameResponse {
  success: boolean;
  room?: Room;
  message?: string;
}