
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { uploadPath } from "../middlewares/upload";

export const UploadRouter = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imageUrl = `/temp/${req.file.filename}`;

  // Programar eliminación después de 5 minutos
  setTimeout(() => {
    fs.unlink(path.join(uploadPath, req.file!.filename), (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  },  60*1000); // 5 minutos

  res.json({ url: imageUrl });
};