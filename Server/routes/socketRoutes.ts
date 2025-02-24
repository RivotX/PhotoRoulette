import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId } from "../utils/features";

console.log("Socket routes initialized");

interface Player {
  username: string;
  socketId: string;
}

interface Room {
  gameCode: string;
  players: Player[];
}

const rooms: Room[] = [];

io.on("connection", (socket) => {
  console.log("New Player connected");

  socket.on("join-create-game", (data) => {
    const gameCode: string = data.gameCode;
    const username: string = data.username;
    console.log("rooms: " + JSON.stringify(rooms));

    if (gameCode !== null) {
      console.log("player: " + username, "trying to join room: " + gameCode);
      if (rooms.some(room => room.gameCode === gameCode)) {
        socket.join(gameCode);
        const room = rooms.find(room => room.gameCode === gameCode);
        room?.players.push({ username: username, socketId: socket.id });
        socket.emit("room-of-game", room);
        console.log("Player joined room: " + gameCode);
        // Store gameCode and username in the socket object
        socket.data.gameCode = gameCode;
        socket.data.username = username;
      } else {
        socket.emit("room-of-game", false);
        console.log("Game not found");
      }
    } else {
      let codeGame: string = generateRoomId(rooms);
      rooms.push({ gameCode: codeGame, players: [{ username, socketId: socket.id }] });
      const roomjoined = rooms.find(room => room.gameCode === codeGame);
      socket.join(codeGame);
      console.log("Player created room: " + codeGame);
      socket.emit("room-of-game", roomjoined);
      // Store gameCode and username in the socket object
      socket.data.gameCode = codeGame;
      socket.data.username = username;
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    console.log("leave-game");
    const gameCode: string = socket.data.gameCode;
    const username: string = socket.data.username;
    const room = rooms.find(room => room.gameCode === gameCode);
    if (room !== undefined) {
      const player = room.players.find(player => player.username === username);
      if (player !== undefined) {
        room.players = room.players.filter(player => player.username !== username);
        if (room.players.length === 0) {
          rooms.filter(room => room.gameCode !== gameCode);
          console.log("Room deleted: " + gameCode);
        }
      }
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };