import dotenv from "dotenv";
dotenv.config();
import { server } from "./app.js";
import "./routes/socketRoutes.js"
server.listen(process.env.PORT || 3000, () => console.log("Server running on port 3000"));
