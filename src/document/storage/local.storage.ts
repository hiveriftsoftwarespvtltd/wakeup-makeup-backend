// src/media/storage/local.storage.ts
import { Express } from 'express';


import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageProvider, UploadResult } from './storage.interface';

export class LocalStorage implements StorageProvider {
  async upload(
    file: any,
    folder: string,
  ): Promise<UploadResult> {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${randomUUID()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/${folder}/${fileName}`,
      publicId: `${folder}/${fileName}`, // 🔥 used for delete
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  async delete(publicId: string, resourceType?: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'uploads', publicId);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}