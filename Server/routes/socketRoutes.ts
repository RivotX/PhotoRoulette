import { io } from "../app";

console.log("Socket routes initialized");

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("message", (data) => {
    console.log("Received message:", data);
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
  });
});
