export interface Player {
  username: string;
  points: number;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  lastAnswerCorrect: boolean;
  lastGuess: string;
}

export interface ScoreRound {
  username: string;
  points: number;
  isHost: boolean;
  lastAnswerCorrect: boolean;
}



export interface PlayerId {
  username: string;
  gameCode: string;
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
  rounds?: number;
}