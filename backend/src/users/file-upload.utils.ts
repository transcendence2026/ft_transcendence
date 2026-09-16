import { extname } from 'path';
import { Request } from 'express';

export const editFileName = (
    req: Request,
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