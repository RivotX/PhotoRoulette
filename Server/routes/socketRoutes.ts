import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId, getRandomPlayer } from "../utils/features";
import { Player, Room, JoinCreateGameData, RoomOfGameResponse, PlayerId, ScoreRound } from "../models/interfaces";

console.log("Socket routes initialized");

const rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
  console.log("New Player connected");
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  console.log("Connected sockets:", connectedSockets);

  socket.on("join-create-game", (data: JoinCreateGameData) => {
    try {
      const { username } = data;
      let { gameCode } = data;
      console.log("------------------------------------------------");
      console.log("rooms: " + rooms);

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
              const newPlayer: Player = { username, socketId: socket.id, isHost: false, isReady: false, points: 0 };
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
        const newRoom: Room = {
          gameCode: codeGame,
          rounds: 10,
          started: false,
          players: [{ username, socketId: socket.id, isHost: true, isReady: false, points: 0 }],
          intervalId: null,
          buttonPressed: false,
          currentPlayer: null,
          round: 0,
        };
        rooms.push(newRoom);
        socket.join(codeGame);
        console.log("Player created room: " + codeGame);
        console.log("rooms creadas:", rooms);
        const response: RoomOfGameResponse = { success: true, room: newRoom };
        socket.emit("room-of-game", response);
        socket.data.gameCode = codeGame;
        socket.data.username = username;
      }
    } catch (error) {
      console.error("Error in join-create-game:", error);
    }
  });

  socket.on("start-game", (data: { gameCode: string }) => {
    try {
      const gameCode = data.gameCode;
      if (gameCode) {
        const room = rooms.find((room) => room.gameCode === gameCode);
        if (room) {
          room.started = true;

          io.to(room.gameCode).emit("game-started", room.players);
          console.log("Game started: " + gameCode);
        } else {
          console.error("Room not found for game code:", gameCode);
        }
      } else {
        console.error("Game code not found for socket:", socket.id);
      }
    } catch (error) {
      console.error("Error in start-game:", error);
    }
  });

    const startNextRound = (room: Room) => {
    try {
      if (!room) {
        console.error("Room not found");
        return;
      }
  
      if (room.round >= room.rounds) {
        if (room.intervalId) clearInterval(room.intervalId);
        console.log("All rounds completed");
        io.to(room.gameCode).emit("game-over", { room });
        return;
      }
  
      room.currentPlayer = getRandomPlayer(room.players);
      if (!room.currentPlayer) {
        console.error("Current player not found");
        return;
      }
      console.log("Selected player to send photo: " + room.currentPlayer.username);
      io.to(room.currentPlayer.socketId).emit("your-turn", { round: room.round + 1 });
      console.log("Your turn: " + room.currentPlayer.username + " - " + room.currentPlayer.socketId);
      room.round++;
  
      // Emit score-round after 7 seconds
      setTimeout(() => {
        const scores : ScoreRound[] = room.players.map(player => ({
          username: player.username,
          points: player.points,
          isHost : player.isHost
        }))
        io.to(room.gameCode).emit("score-round", scores);
      }, 7000);
  
    } catch (error) {
      console.error("Error in startNextRound:", error);
    }
  };

  socket.on("im-ready", (data: PlayerId) => {
    try {
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
          console.log("Room: " + room);

          room.round = 0;
          setTimeout(() => {
            startNextRound(room);
            room.intervalId = setInterval(() => {
              if (!room.buttonPressed) {
                startNextRound(room);
              }
            }, 10000);
          }, 2000); // 2 seconds delay
        }
      } else {
        console.error("Room not found for game code:", gameCode);
      }
    } catch (error) {
      console.error("Error in im-ready:", error);
    }
  });

  socket.on("button-pressed", () => {
    try {
      const gameCode = socket.data.gameCode;
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const iscurrentPlayer = room.currentPlayer?.socketId === socket.id;
        if (iscurrentPlayer) {
          room.buttonPressed = true;
          if (room.intervalId) clearInterval(room.intervalId);
        }
      }
    } catch (error) {
      console.error("Error in button-pressed:", error);
    }
  });

  socket.on("button-released", () => {
    try {
      const gameCode = socket.data.gameCode;
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const iscurrentPlayer = room.currentPlayer?.socketId === socket.id;
        if (iscurrentPlayer) {
          room.buttonPressed = false;
          room.intervalId = setTimeout(() => {
            if (!room.buttonPressed) {
              startNextRound(room);
            }
            room.intervalId = setInterval(() => {
              if (!room.buttonPressed) {
                startNextRound(room);
              }
            }, 10000);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error in button-released:", error);
    }
  });

  socket.on("photo-sent", (data: { photo: string; username: string; gameCode: string; round: number }) => {
    try {
      const { photo, username, gameCode, round } = data;
      console.log("Photo received from: " + username);
      io.to(gameCode).emit("photo-received", { photo, username, round });
    } catch (error) {
      console.error("Error in photo-sent:", error);
    }
  });

  socket.on("correct-answer", (data: PlayerId) => {
    try {
      const { username, gameCode} = data;
      console.log("Photo received from: " + username);
      const room=rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const player = room.players.find((player) => player.username === username);
        if (player) {
          player.points++;
          console.log("Player points: " + player.points);
        }
      }
      
    } catch (error) {
      console.error("Error in photo-sent:", error);
    }
  });

  socket.on("disconnect", () => {
    try {
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
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };
