import dotenv from "dotenv";
dotenv.config();
import { server } from "./app.tsx";
import "./routes/socketRoutes.tsx";
server.listen(process.env.PORT || 3000, () => console.log("Server running on port 3000"));
