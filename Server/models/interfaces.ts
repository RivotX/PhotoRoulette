export interface Player {
  username: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  gameCode: string;
  players: Player[];
  rounds: number;
  started: boolean;
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