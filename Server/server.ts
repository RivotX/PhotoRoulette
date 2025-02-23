import dotenv from "dotenv";
dotenv.config();
import { server } from "./app";
import "./routes/socketRoutes";
server.listen(process.env.PORT || 3000, () => console.log("Server running on port 3000"));
