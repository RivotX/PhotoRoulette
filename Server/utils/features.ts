import { Player, Room } from "../models/interfaces";

function generateRoomId(rooms: { gameCode: string; players: { username: string; socketId: string }[] }[]): string {
  let roomId: string;
  do {
    roomId = Math.floor(100000 + Math.random() * 900000).toString(); // Genera un número de 6 dígitos
  } while (rooms.some(room => room.gameCode === roomId));
  return roomId;
}

function getRandomPlayer(players: Player[]): Player {
  return players[Math.floor(Math.random() * players.length)];
}

function safeRoomData(room: Room): any {
  const { intervalId, ...safeRoom } = room;
  
  // Asegúrate que currentPlayer no tiene referencias circulares
  if (safeRoom.currentPlayer) {
    safeRoom.currentPlayer = {
      username: safeRoom.currentPlayer.username,
      socketId: safeRoom.currentPlayer.socketId,
      isHost: safeRoom.currentPlayer.isHost,
      isReady: safeRoom.currentPlayer.isReady,
      points: safeRoom.currentPlayer.points,
      lastAnswerCorrect: safeRoom.currentPlayer.lastAnswerCorrect,
      lastGuess: safeRoom.currentPlayer.lastGuess,
      hasPlantedPhoto: safeRoom.currentPlayer.hasPlantedPhoto,
      plantedPhoto: undefined // Evitamos enviar la foto plantada directamente
    };
  }
  
  return safeRoom;
}

export { generateRoomId, getRandomPlayer, safeRoomData };