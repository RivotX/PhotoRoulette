import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId } from "../utils/features";
import { Player, Room, JoinCreateGameData, RoomOfGameResponse } from "../models/interfaces";

console.log("Socket routes initialized");

const rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
  console.log("New Player connected");

  socket.on("join-create-game", (data: JoinCreateGameData) => {
    const { gameCode, username } = data;
    console.log("rooms: " + JSON.stringify(rooms));

    if (gameCode) {
      console.log("player: " + username, "trying to join room: " + gameCode);
      const room = rooms.find(room => room.gameCode === gameCode);
      if (room) {
        socket.join(gameCode);
        const newPlayer: Player = { username, socketId: socket.id, isHost: false };
        room.players.push(newPlayer);
        const response: RoomOfGameResponse = { success: true, room };
        socket.emit("room-of-game", response);
        socket.broadcast.to(gameCode).emit("player-joined", newPlayer);
        console.log("Player joined room: " + gameCode);
        socket.data.gameCode = gameCode;
        socket.data.username = username;
      } else {
        const response: RoomOfGameResponse = { success: false, message: "Game not found" };
        socket.emit("room-of-game", response);
        console.log("Game not found");
      }
    } else {
      const codeGame = generateRoomId(rooms);
      const newRoom: Room = { gameCode: codeGame, players: [{ username, socketId: socket.id, isHost: true }] };
      rooms.push(newRoom);
      socket.join(codeGame);
      console.log("Player created room: " + codeGame);
      const response: RoomOfGameResponse = { success: true, room: newRoom };
      socket.emit("room-of-game", response);
      socket.data.gameCode = codeGame;
      socket.data.username = username;
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const gameCode: string = socket.data.gameCode;
    const username: string = socket.data.username;
    const room = rooms.find(room => room.gameCode === gameCode);
    if (room) {
      room.players = room.players.filter(player => player.username !== username);
      if (room.players.length === 0) {
        rooms.splice(rooms.indexOf(room), 1);
        console.log("Room deleted: " + gameCode);
      } else {
        socket.broadcast.to(gameCode).emit("player-left", username);
      }
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };