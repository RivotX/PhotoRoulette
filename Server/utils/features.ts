import { Player } from "../models/interfaces";

function generateRoomId(rooms: { gameCode: string; players: { username: string; socketId: string }[] }[]): string {
  let roomId: string;
  do {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.some(room => room.gameCode === roomId));
  return roomId;
}

function getRandomPlayer(players: Player[]): Player {
  return players[Math.floor(Math.random() * players.length)];
}

export { generateRoomId, getRandomPlayer };