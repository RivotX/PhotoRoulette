import getEnvVars from "@/config";
import React, { createContext, useContext, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { GameContextProps, GameProviderProps } from "@/app/models/interfaces";
const { SERVER_URL } = getEnvVars();

const GameContext = createContext<GameContextProps>({
  socket: null,
  gameCode: null,
  username: null,
  setGameCode: () => {},
  setUsername: () => {},
  startSocket: () => {},
  endSocket: () => {},
});

export const useGameContext = () => useContext(GameContext);

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const startSocket = () => {
    console.log("Conectando al servidor...");
    const newSocket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.connect();
    setSocket(newSocket);

    console.log("newSocket:", newSocket);

    newSocket.on("connect", () => {
      console.log("Usuario conectado al servidor");
    });

    newSocket.on("disconnect", () => {
      console.log("Desconectado del servidor");
    });

    return () => {
      newSocket.disconnect();
    };
  };

  const endSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return <GameContext.Provider value={{ socket, gameCode, username, setGameCode, setUsername, startSocket, endSocket }}>{children}</GameContext.Provider>;
};

export default GameProvider;