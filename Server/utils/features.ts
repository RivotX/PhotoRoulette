import { Player } from "../models/interfaces";

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

export { generateRoomId, getRandomPlayer };