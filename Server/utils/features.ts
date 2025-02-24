import { Socket } from "socket.io";

 function generateRoomId(rooms:{ gameCode: string, players:{username:string, socket: Socket}[] }[]): string {
    let roomId: string;
    do {
      roomId = Math.random().toString(36).substring(2, 8);
    } while (rooms.some(room => room.gameCode === roomId));
    return roomId;
  }

  export { generateRoomId };