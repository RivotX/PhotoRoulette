function generateRoomId(rooms: { gameCode: string; players: { username: string; socketId: string }[] }[]): string {
  let roomId: string;
  do {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms.some(room => room.gameCode === roomId));
  return roomId;
}

export { generateRoomId };