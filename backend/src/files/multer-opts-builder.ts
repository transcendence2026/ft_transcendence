import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

export const editFileName = (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
) => {
  // 1. Obtiene la extensión (".png", ".jpg") del archivo original
  const fileExtName = extname(file.originalname);

  // 2. Genera un hash aleatorio de 16 caracteres en hexadecimal
  const randomName = Array(16)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');

  // 3. Devuelve null para el error y el nuevo nombre (ej: "a9f1b2c3d4e5f678.png")
  callback(null, `${randomName}${fileExtName}`);
};


export const createMulterOptions = (subfolder: string): MulterOptions => ({
  // 1. Almacenamiento en disco y asignación de carpeta dinámica
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      const destination = join(process.cwd(), 'uploads', subfolder);
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: editFileName,
  }),

  // 2. Filtro de extensiones (Solo JPG, JPEG, PNG y WEBP - Bloquea SVG)
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return callback(
        new BadRequestException('Only images in JPG, JPEG, PNG o WEBP format are allowed'),
        false,
      );
    }
    callback(null, true);
  },

  // 3. Límite de tamaño (ej: 2 MB)
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
});