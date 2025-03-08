import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId, getRandomPlayer } from "../utils/features";
import { Player, Room, JoinCreateGameData, RoomOfGameResponse, PlayerId, ScoreRound } from "../models/interfaces";

console.log("Socket routes initialized");

const rooms: Room[] = [];
const roomTimeouts: { [key: string]: NodeJS.Timeout } = {};
const TimeToDelete = 30 * 60 * 1000; // 30 minutes
const SecondsForRound = 10000;
const SecondsForShowScore = 7000;
const SecondsForButtonPress = SecondsForRound - SecondsForShowScore;
const SecondsToStart = 1000;

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
          if (roomTimeouts[gameCode]) {
            clearTimeout(roomTimeouts[gameCode]);
            delete roomTimeouts[gameCode];
          }
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
              let newPlayer: Player;
              if (room.players.length === 0) {
                newPlayer = {
                  username,
                  socketId: socket.id,
                  isHost: true,
                  isReady: false,
                  points: 0,
                  lastAnswerCorrect: false,
                  lastGuess: "No guess",
                };
              } else {
                newPlayer = {
                  username,
                  socketId: socket.id,
                  isHost: false,
                  isReady: false,
                  points: 0,
                  lastAnswerCorrect: false,
                  lastGuess: "No guess",
                };
              }
              room.players.push(newPlayer);
              const response: RoomOfGameResponse = { success: true, room, rounds: room.rounds };
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
          players: [
            {
              username,
              socketId: socket.id,
              isHost: true,
              isReady: false,
              points: 0,
              lastAnswerCorrect: false,
              lastGuess: "No guess",
            },
          ],
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
            room.started = false;
            roomTimeouts[gameCode] = setTimeout(() => {
              const roomIndex = rooms.findIndex((room) => room.gameCode === gameCode);
              if (roomIndex !== -1) {
                rooms.splice(roomIndex, 1);
                delete roomTimeouts[gameCode];
                console.log("Room deleted after 30 minutes: " + gameCode);
              }
            }, TimeToDelete); // 30 minutes
            console.log("Room will be deleted in 30 minutes if no one joins: " + gameCode);
          } else {
            socket.broadcast.to(gameCode).emit("player-left", username);
          }
        }
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });

  socket.on("set-rounds", (data: { gameCode: string; rounds: number }) => {
    try {
      const { gameCode, rounds } = data;
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        room.rounds = rounds;
        io.to(room.gameCode).emit("rounds-updated", rounds);
        console.log(`Rounds updated to ${rounds} for game: ${gameCode}`);
      } else {
        console.error("Room not found for game code:", gameCode);
      }
    } catch (error) {
      console.error("Error in set-rounds:", error);
    }
  });

  socket.on("start-game", (data: { gameCode: string }) => {
    try {
      const gameCode = data.gameCode;
      if (gameCode) {
        const room = rooms.find((room) => room.gameCode === gameCode);
        if (room) {
          room.started = true;

          io.to(room.gameCode).emit("game-started", room.players, room.rounds);
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

      if (room.round >= room.rounds || room.players.length < 2) {
        const finalScore: ScoreRound[] = room.players.map((player) => ({
          username: player.username,
          points: player.points,
          isHost: player.isHost,
          lastAnswerCorrect: player.lastAnswerCorrect,
          lastGuess: player.lastGuess,
        }));
        const OrderByPoints = finalScore.sort((a, b) => b.points - a.points);
        if (room.intervalId) clearInterval(room.intervalId);
        console.log("All rounds completed or less than 2 players");
        console.log("Final score: " + OrderByPoints);
        io.to(room.gameCode).emit("game-over", { finalScore: OrderByPoints });
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
        const scores: ScoreRound[] = room.players.map((player) => ({
          username: player.username,
          points: player.points,
          isHost: player.isHost,
          lastAnswerCorrect: player.lastAnswerCorrect,
          lastGuess: player.lastGuess,
        }));
        io.to(room.gameCode).emit("score-round", scores);
      }, SecondsForShowScore);
    } catch (error) {
      console.error("Error in startNextRound:", error);
    }
  };

  socket.on("remove-player", (data: { gameCode: string; socketId: string }) => {
    try {
      const { gameCode, socketId } = data;
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const playerIndex = room.players.findIndex((player) => player.socketId === socketId);
        if (playerIndex !== -1) {
          const removedPlayer = room.players.splice(playerIndex, 1)[0];
          io.to(room.gameCode).emit("player-removed", removedPlayer);
          console.log("Player removed: " + removedPlayer.username);
        }
      } else {
        console.error("Room not found for game code:", gameCode);
      }
    } catch (error) {
      console.error("Error in remove-player:", error);
    }
  });

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
            }, SecondsForRound);
          }, SecondsToStart); // 1 seconds delay
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
          socket.broadcast.to(gameCode).emit("button-pressed");
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
          socket.broadcast.to(gameCode).emit("button-released");
          room.intervalId = setTimeout(() => {
            if (!room.buttonPressed) {
              startNextRound(room);
            }
            room.intervalId = setInterval(() => {
              if (!room.buttonPressed) {
                startNextRound(room);
              }
            }, SecondsForRound);
          }, SecondsForButtonPress);
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

  socket.on("correct-answer", (data: { username: string; gameCode: string; guess: string }) => {
    try {
      const { username, gameCode, guess } = data;
      console.log("Correct answer from: " + username + " - guess: " + guess);
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const player = room.players.find((player) => player.username === username);
        if (player) {
          player.points++;
          player.lastAnswerCorrect = true;
          player.lastGuess = guess;
          console.log("Player points: " + player.points);
        }
      }
    } catch (error) {
      console.error("Error in correct-answer:", error);
    }
  });

  socket.on("incorrect-answer", (data: { username: string; gameCode: string; guess: string }) => {
    try {
      const { username, gameCode, guess } = data;
      console.log("Incorrect answer from: " + username + " - guess: " + guess);
      const room = rooms.find((room) => room.gameCode === gameCode);
      if (room) {
        const player = room.players.find((player) => player.username === username);
        if (player) {
          player.lastAnswerCorrect = false;
          player.lastGuess = guess; // Guardar la última respuesta
          console.log("Player points: " + player.points);
        }
      }
    } catch (error) {
      console.error("Error in incorrect-answer:", error);
    }
  });

  socket.on("emoji-reaction", (data: { gameCode: string; username: string; emoji: string }) => {
    try {
      const { gameCode, username, emoji } = data;
      console.log(`Emoji reaction from ${username}: ${emoji}`);

      // Send the emoji reaction to all players in the room
      io.to(gameCode).emit("emoji-reaction", { username, emoji });
    } catch (error) {
      console.error("Error in emoji-reaction:", error);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };
