import express from "express";
import { UploadRouter } from "../controllers/UploadController";
import { upload } from "../middlewares/upload";

const router = express.Router();

router.post("/upload", upload.single("image"), (req, res, next) => {
  UploadRouter(req, res).catch(next);
});

router.get("/", (req, res) => {
  res.send("SERVER RUNNING");
});

export default router;
