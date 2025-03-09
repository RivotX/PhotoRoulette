import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId, getRandomPlayer } from "../utils/features";
import { Player, Room, JoinCreateGameData, RoomOfGameResponse, PlayerId, ScoreRound } from "../models/interfaces";

console.log("Socket routes initialized");

const rooms: Room[] = [];
const roomTimeouts: { [key: string]: NodeJS.Timeout } = {};
const TimeToDelete = 30 * 60 * 1000; // 30 minutes
const SecondsForRound = 11000;
const SecondsForShowScore = 8000;
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
            room.plantedPhotosShown = 0;
            room.buttonPressed = false;
            room.currentPlayer = null;
            room.round = 0;
            
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
    
        console.log(`\n[ROUND INFO] Game: ${room.gameCode} - Starting round ${room.round + 1}/${room.rounds}`);
        
        // Check if we're at the end of the game
        if (room.round >= room.rounds || room.players.length < 2) {
          // Before ending, check if there are any unused planted photos
          const playersWithPlantedPhotos = room.players.filter(player => player.plantedPhoto);
          
          console.log(`[END GAME CHECK] Round: ${room.round}/${room.rounds}, Players: ${room.players.length}, Planted photos left: ${playersWithPlantedPhotos.length}`);
          
          
          // End the game if no planted photos left
          console.log(`[GAME OVER] Game ${room.gameCode} completed. No more rounds or planted photos.`);
          const finalScore: ScoreRound[] = room.players.map((player) => ({
            username: player.username,
            points: player.points,
            isHost: player.isHost,
            lastAnswerCorrect: player.lastAnswerCorrect,
            lastGuess: player.lastGuess,
          }));
          const OrderByPoints = finalScore.sort((a, b) => b.points - a.points);
          if (room.intervalId) clearInterval(room.intervalId);
          
          console.log("[FINAL SCORES]", OrderByPoints.map(score => `${score.username}: ${score.points}`).join(', '));
          
          io.to(room.gameCode).emit("game-over", { finalScore: OrderByPoints });
          return;
        }
    
        // Initialize plantedPhotosShown property if not set
        if (room.plantedPhotosShown === undefined) {
          room.plantedPhotosShown = 0;
          console.log(`[INIT] Initialized plantedPhotosShown counter for game ${room.gameCode}`);
        }
    
        // Get all players with planted photos
        const playersWithPlantedPhotos = room.players.filter(player => player.plantedPhoto);
        
        console.log(`[PLANTED PHOTOS] Found ${playersWithPlantedPhotos.length} planted photos remaining`);
        if (playersWithPlantedPhotos.length > 0) {
          console.log(`[PLANTED PHOTOS] From players: ${playersWithPlantedPhotos.map(p => p.username).join(', ')}`);
        }
        // Set up a distribution pattern for planted photos
        // We'll try to space them out across the game
        const totalRounds = room.rounds;
        const remainingRounds = totalRounds - room.round;
        const plantedPhotosCount = playersWithPlantedPhotos.length;
    
        console.log(`[ROUNDS INFO] Total: ${totalRounds}, Current: ${room.round}, Remaining: ${remainingRounds}`);
        console.log(`[PLANTED PHOTOS] Count: ${plantedPhotosCount}, Already shown: ${room.plantedPhotosShown || 0}`);
        
        // Calculate a probability based on how many planted photos we have 
        // and how many rounds are left
        let shouldShowPlantedPhoto = false;
        let selectionReason = "";
        
        if (plantedPhotosCount > 0) {
          // Create "slots" for planted photos throughout the game
          // We add a small random factor to make it less predictable
          
          // If we're near the end and still have planted photos, increase chances
          if (remainingRounds <= plantedPhotosCount + 1) {
            // Higher chance when we're running out of rounds
            const randomChance = Math.random();
            shouldShowPlantedPhoto = randomChance < 0.7;
            selectionReason = `End game approach (${remainingRounds} rounds left, ${plantedPhotosCount} photos). Random chance: ${randomChance.toFixed(2)} vs threshold 0.7`;
          } else {
            // Generate a random position between 0.1 and 0.9 for each round
            // This creates "random slots" throughout the game
            const roundPosition = (room.round / totalRounds); 
            console.log(`[POSITION] Current round position: ${roundPosition.toFixed(2)} (${room.round}/${totalRounds})`);
            
            const plantedPhotoPositions = [];
            
            // Create target positions for planted photos distributed throughout the game
            for (let i = 0; i < plantedPhotosCount; i++) {
              // Space out the target positions - we add randomness (±0.1) to make it less predictable
              const targetPos = (1 + i) / (plantedPhotosCount + 1);
              const randomizedPos = targetPos + (Math.random() * 0.2 - 0.1);
              const finalPos = Math.min(0.95, Math.max(0.05, randomizedPos));
              plantedPhotoPositions.push(finalPos);
            }
            
            console.log(`[TARGET POSITIONS] ${plantedPhotoPositions.map(pos => pos.toFixed(2)).join(', ')}`);
            
            // Check if we're close to any of our target positions
            const nearPositions = plantedPhotoPositions.filter(pos => 
              Math.abs(roundPosition - pos) < (0.8 / totalRounds));
              
            const isNearPosition = nearPositions.length > 0;
            
            shouldShowPlantedPhoto = isNearPosition;
            selectionReason = isNearPosition 
              ? `Near target position: ${nearPositions.map(pos => pos.toFixed(2)).join(', ')}` 
              : `Not near any target position`;
          }
        }
    
        console.log(`[DECISION] Should show planted photo: ${shouldShowPlantedPhoto ? 'YES' : 'NO'} - ${selectionReason}`);
    
        if (shouldShowPlantedPhoto && playersWithPlantedPhotos.length > 0 && room.round < room.rounds) {
          // Randomly select a player with a planted photo
          const randomIndex = Math.floor(Math.random() * playersWithPlantedPhotos.length);
          const selectedPlayer = playersWithPlantedPhotos[randomIndex];
          
          room.currentPlayer = selectedPlayer;
          room.plantedPhotosShown = (room.plantedPhotosShown || 0) + 1;
          console.log(`[PLANTED PHOTO SELECTED] From ${selectedPlayer.username} (${room.plantedPhotosShown} planted photos shown so far)`);
          
          // Emit event to all players with the planted photo
          io.to(room.gameCode).emit("photo-received", { 
            photo: selectedPlayer.plantedPhoto, 
            username: selectedPlayer.username, 
            round: room.round + 1,
            isPlanted: true
          });
          
          room.round++;
          console.log(`[ROUND ADVANCED] Now on round ${room.round}/${room.rounds}`);
          
          // Remove the planted photo so it's not used again
          selectedPlayer.plantedPhoto = undefined;
          console.log(`[PLANTED PHOTO CONSUMED] Removed from ${selectedPlayer.username}'s inventory`);
          
          // Emit score-round after the show score time
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
        } else {
          // Original logic for random photo selection
          room.currentPlayer = getRandomPlayer(room.players);
          if (!room.currentPlayer) {
            console.error("[ERROR] Current player not found");
            return;
          }
          console.log(`[RANDOM PLAYER SELECTED] ${room.currentPlayer.username} will provide a photo`);
          io.to(room.currentPlayer.socketId).emit("your-turn", { round: room.round + 1 });
          
          room.round++;
          console.log(`[ROUND ADVANCED] Now on round ${room.round}/${room.rounds}`);
    
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
        }
      } catch (error) {
        console.error("[ERROR] in startNextRound:", error);
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

  socket.on("mark-player-planted", (data: { gameCode: string; username: string }) => {
    try {
      const { gameCode, username } = data;
      const room = rooms.find((room) => room.gameCode === gameCode);
      
      if (room) {
        const player = room.players.find((player) => player.username === username);
        
        if (player) {
          player.hasPlantedPhoto = true;
          console.log(`${username} marked that they will plant a photo in game ${gameCode}`);
          
          // Notify all players in the room that a player has marked to plant a photo
          // io.to(gameCode).emit("player-marked-planted", player);
        }
      }
    } catch (error) {
      console.error("Error in mark-player-planted:", error);
    }
  });

  socket.on("plant-photo", (data: { gameCode: string; username: string; photoUrl: string }) => {
    try {
      const { gameCode, username, photoUrl } = data;
      const room = rooms.find((room) => room.gameCode === gameCode);
      
      if (room) {
        const player = room.players.find((player) => player.username === username);
        
        if (player) {
          player.plantedPhoto = photoUrl;
          console.log(`${username} uploaded a planted photo in game ${gameCode}`);
          
          // No need to notify all players since they already see the hasPlantedPhoto flag
        }
      }
    } catch (error) {
      console.error("Error in plant-photo:", error);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };
