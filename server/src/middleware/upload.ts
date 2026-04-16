import multer from "multer";

// Настройка хранения в памяти (для дальнейшей обработки)
const storage = multer.memoryStorage();

// Фильтр для 3D файлов
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedExtensions = [
    ".gltf",
    ".glb",
    ".fbx",
    ".obj",
    ".stl",
    ".ply",
    ".3mf",
  ];
  const extension = "." + file.originalname.split(".").pop()?.toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error(`Неподдерживаемый формат файла: ${extension}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB лимит
  },
});
