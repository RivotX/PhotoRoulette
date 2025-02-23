import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { useRoute } from "@react-navigation/native";

interface OnlineProps {
  gameCode?: string;
}

const Online: React.FC<OnlineProps> = ({}) => {
  const route = useRoute();
  const { gameCode } = (route.params || {}) as OnlineProps;
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);

  useEffect(() => {

    console.log("Conectando al servidor...");
    // Crea la conexión al servidor
    // Asegúrate de que la URL sea la correcta (por ejemplo, si tu server corre en localhost:3000):
    const newSocket = io("http://ipv4:3000", {
      // Opciones adicionales, si las necesitas
      transports: ["websocket"], // fuerza el uso de websockets
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    newSocket.connect();

    // Guarda la instancia del socket en el estado
    setSocket(newSocket);

    console.log("newSocket:", newSocket);

    // Maneja la recepción de mensajes desde el servidor
    newSocket.on("connect", () => {
      console.log("Usuario conectado al servidor");
    });

    // Opcional: Maneja la desconexión
    newSocket.on("disconnect", () => {
      console.log("Desconectado del servidor");
    });

    // Limpia la conexión cuando se desmonte el componente
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      // Envía un mensaje al servidor
      socket.emit("join-game", gameCode);

      // Maneja la recepción de mensajes desde el servidor
      socket.on("game-joined", (data) => {
        console.log("game-joined:", data);
      });
    }
  }, [socket]);

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold`}>Online Screen</Text>
    </View>
  );
};

export default Online;
