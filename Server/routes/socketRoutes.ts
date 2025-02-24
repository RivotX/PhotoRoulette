import { Socket } from "socket.io";
import { io } from "../app";
import { generateRoomId } from "../utils/features";

console.log("Socket routes initialized");

const rooms:{ gameCode: string, players:{username:string, socket: Socket}[] }[] =[];


io.on("connection", (socket) => {
  console.log("New Player connected");

  socket.on("join-create-game", (data) => {
    // Si gameCode no es undefined comprueba si esta en la lista de rooms si no esta emite un error, si esta lo añade a la sala
    // Si gameCode es undefined crea una sala nueva y añade al cliente a la sala
    const gameCode : string = data.gameCode;
    const username : string = data.username;
    console.log("gameCode introducido: " + gameCode);
    console.log("rooms: " + rooms);
    
    if (gameCode !== undefined) {

      if(rooms.some(room => room.gameCode === gameCode)){
        socket.join(gameCode);
        const room = rooms.find(room => room.gameCode === gameCode);
        room?.players.push({username: username, socket: socket});
        socket.emit("game-joined", gameCode);
        console.log("Player joined room: " + gameCode);
      }else{
        socket.emit("error-code", "Game not found");
        console.log("Game not found");
      }
    }else{
      let room : string = generateRoomId(rooms);
      rooms.push({gameCode: room, players: [{username, socket}]});
      socket.join(room);
      console.log("Player created room: " + room);
      socket.emit("game-created", room);

    }
  });

  io.on("leave-game", (data) => {
    console.log("leave-game");
    const gameCode : string = data.gameCode;
    const username : string = data.username;
    const room = rooms.find(room => room.gameCode === gameCode);
    if(room !== undefined){
      const player = room.players.find(player => player.username === username);
      if(player !== undefined){
        room.players = room.players.filter(player => player.username !== username);
        if(room.players.length === 0){
          rooms.filter(room => room.gameCode !== gameCode);
          console.log("Room deleted: " + gameCode);
        }
      }
    }
  }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});

export { rooms };