export interface Player {
  username: string;
  socketId: string;
}

export interface Room {
  gameCode: string;
  players: Player[];
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