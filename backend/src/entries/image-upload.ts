import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';

export const MAX_ENTRY_IMAGE_SIZE = 10 * 1024 * 1024;

export interface UploadedEntryImage {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const imageFormats = new Map([
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
]);

export function validateEntryImage(file: UploadedEntryImage): string {
  const extension = extname(file.originalname).toLowerCase();
  const supportedExtensions = imageFormats.get(file.mimetype);

  if (!supportedExtensions || !supportedExtensions.has(extension)) {
    throw new BadRequestException(
      'Images must be JPEG, PNG, or WebP with a matching file extension',
    );
  }
  if (file.size < 1 || file.size > MAX_ENTRY_IMAGE_SIZE) {
    throw new BadRequestException(
      `Each image must be no larger than ${MAX_ENTRY_IMAGE_SIZE / 1024 / 1024} MB`,
    );
  }
  return extension === '.jpeg' ? '.jpg' : extension;
}
