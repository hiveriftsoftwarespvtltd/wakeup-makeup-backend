// src/media/storage/upload.storage.ts

import { Express } from 'express';

export type UploadResult = {
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  originalName: string;
};

export interface StorageProvider {
  upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult>;

  delete(publicId: string): Promise<void>;
}