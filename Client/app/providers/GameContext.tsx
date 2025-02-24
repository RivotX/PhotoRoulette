import getEnvVars from "@/config";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
const { SERVER_URL } = getEnvVars();

interface GameContextProps {
  socket: Socket<DefaultEventsMap, DefaultEventsMap> | null;
}

const GameContext = createContext<GameContextProps>({ socket: null });

export const useGameContext = () => useContext(GameContext);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <GameContext.Provider value={{ socket }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;