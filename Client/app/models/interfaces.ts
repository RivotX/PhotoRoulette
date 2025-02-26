import { Socket } from "socket.io-client";

export interface Player {
  username: string;
  socketId: string;
  isHost: boolean;
}

export interface Room {
  gameCode: string;
  players: Player[];
}

export interface RandomPhotoResponse {
  gameCode: string;
  username: string;
  photo: string | null; //por ahora para probar
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

export interface GameContextProps {
  socket: Socket | null;
  gameCode: string | null;
  username: string | null;
  setGameCode: (code: string | null) => void;
  setUsername: (name: string | null) => void;
  startSocket: () => void;
  endSocket: () => void;
}

export interface GameProviderProps {
  children: React.ReactNode;
}

export interface PhotoContextProps {
  photoUri: string | null;
  requestGalleryPermission: (options: { askAgain: boolean }) => Promise<boolean>;
  getRandomPhoto: () => Promise<void>;
  setPhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
  handleContinue: () => Promise<void>;
}

export interface PhotoProviderProps {
  children: React.ReactNode;
}
