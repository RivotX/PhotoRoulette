import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId, getRandomPlayer } from "../utils/features";
import { Player, Room, JoinCreateGameData, RoomOfGameResponse } from "../models/interfaces";

console.log("Socket routes initialized");

const rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
  console.log("New Player connected");
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  console.log("Connected sockets:", connectedSockets);

  socket.on("join-create-game", (data: JoinCreateGameData) => {
    const { username } = data;
    let { gameCode } = data;
    console.log("------------------------------------------------");
    console.log("rooms: " + JSON.stringify(rooms));

    if (gameCode) {
      gameCode = gameCode.toUpperCase();
      console.log("player: " + username, "trying to join room: " + gameCode);
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        if (room.started) {
          const response: RoomOfGameResponse = { success: false, message: "Game already started" };
          socket.emit("room-of-game", response);
          console.log("Game already started: " + gameCode);
        } else {
          const existingPlayer = room.players.find((player) => player.username === username);
          if (existingPlayer) {
            const response: RoomOfGameResponse = { success: false, message: "Username already taken" };
            socket.emit("room-of-game", response);
            console.log("Username already taken: " + username);
          } else {
            socket.join(gameCode);
            const newPlayer: Player = { username, socketId: socket.id, isHost: false, isReady: false };
            room.players.push(newPlayer);
            const response: RoomOfGameResponse = { success: true, room };
            socket.emit("room-of-game", response);
            socket.broadcast.to(gameCode).emit("player-joined", newPlayer);
            console.log("Player joined room: " + gameCode);
            console.log("rooms despues de unirte:", rooms);
            socket.data.gameCode = gameCode;
            socket.data.username = username;
          }
        }
      } else {
        const response: RoomOfGameResponse = { success: false, message: "Game not found" };
        socket.emit("room-of-game", response);
        console.log("Game not found");
      }
    } else {
      const codeGame = generateRoomId(rooms);
      const newRoom: Room = { gameCode: codeGame, rounds: 10, started: false, players: [{ username, socketId: socket.id, isHost: true, isReady: false }] };
      rooms.push(newRoom);
      socket.join(codeGame);
      console.log("Player created room: " + codeGame);
      console.log("rooms creadas:", rooms);
      const response: RoomOfGameResponse = { success: true, room: newRoom };
      socket.emit("room-of-game", response);
      socket.data.gameCode = codeGame;
      socket.data.username = username;
    }
  });

  socket.on("start-game", (data: { gameCode: string }) => {
    const gameCode = data.gameCode;
    if (gameCode) {
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        room.started = true;
      }
      socket.broadcast.to(gameCode).emit("game-started");
      socket.emit("game-started");
      console.log("Game started: " + gameCode);
    } else {
      console.error("Game code not found for socket:", socket.id);
    }
  });

  socket.on("im-ready", (data: { gameCode: string; username: string }) => {
    const { gameCode, username } = data;
    const room = rooms.find((room) => room.gameCode === gameCode);
    if (room) {
      const player = room.players.find((player) => player.username === username);
      if (player) {
        player.isReady = true;
        console.log("Player ready: " + username);
      }

      const allPlayersReady = room.players.every((player) => player.isReady);
      if (allPlayersReady) {
        console.log("All players ready");
        console.log("Room: " + JSON.stringify(room));
        const randomPlayer = getRandomPlayer(room.players);
        console.log("Selected player to send photo: " + randomPlayer.username);
        io.to(randomPlayer.socketId).emit("your-turn");
        console.log("Your turn: " + randomPlayer.username + " - " + randomPlayer.socketId);
      }
    } else {
      console.error("Room not found for game code:", gameCode);
    }
  });

  socket.on("photo-sent", (data: { photo: string; username: string; gameCode: string }) => {
    const { photo, username, gameCode } = data;
    console.log("Photo received from: " + username);
    socket.broadcast.to(gameCode).emit("photo-received", { photo, username });
    socket.emit("photo-received", { photo, username });
  });

  socket.on("disconnect", () => {
    const gameCode: string = socket.data.gameCode;
    const username: string = socket.data.username;
    console.log("------------------------------");

    console.log("Client disconnected: " + socket.id);
    console.log("gameCode: " + gameCode);
    console.log("username: " + username);
    console.log("------------------------------");

    const roomIndex = rooms.findIndex((room) => room.gameCode === gameCode);
    if (roomIndex !== -1) {
      const room = rooms[roomIndex];
      const playerIndex = room.players.findIndex((player) => player.username === username);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        if (player.isHost && room.players.length > 0) {
          room.players[0].isHost = true;
          socket.broadcast.to(gameCode).emit("new-host", room.players[0]);
          console.log("New host assigned: " + room.players[0].username);
        }
        if (room.players.length === 0) {
          rooms.splice(roomIndex, 1);
          console.log("Room deleted: " + gameCode);
        } else {
          socket.broadcast.to(gameCode).emit("player-left", username);
        }
      }
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };
