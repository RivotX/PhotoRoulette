export interface Player {
  username: string;
  points: number;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  lastAnswerCorrect: boolean;
  lastGuess: string;
  hasPlantedPhoto?: boolean; // Player has marked they will plant a photo
  plantedPhoto?: string; // The actual photo URL once uploaded
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
  plantedPhotosShown?: number; // Track how many planted photos have been shown
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