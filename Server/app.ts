import session from "express-session";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

// import userRoutes from "./routes/userRoutes.js";

const app = express();
app.use(
  // ====================Configuración de la sesión EN EL DEPLOY=============
  // session({
  //   secret: "ÑLKJHGFDSAMNBVCXZPOIUYTREWQ",
  //   resave: true,
  //   saveUninitialized: true,
  //   proxy: true,
  //   cookie: {
  //     maxAge: 1000 * 60 * 60 * 24 * 1000, // 1 día en milisegundos
  //     httpOnly: true,
  //     secure: true, // Establece a true si estás usando HTTPS
  //     sameSite: "none",
  //   },
  // })
  //   ================Configuración de la sesión EN LOCALHOST=================
  session({
    secret: "secreto",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 día en milisegundos
      httpOnly: true,
      secure: false, // Establece a true si estás usando HTTPS
    },
    resave: true,
    saveUninitialized: false,
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.send("SERVER RUNNING");
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export { server, io };
