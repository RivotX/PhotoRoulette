import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../temp");

// Asegurar que la carpeta temporal existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para guardar imágenes temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

export const upload = multer({ storage });
export const uploadPath = uploadDir;
