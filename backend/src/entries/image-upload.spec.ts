import { BadRequestException } from '@nestjs/common';
import { MAX_ENTRY_IMAGE_SIZE, validateEntryImage } from './image-upload';

describe('validateEntryImage', () => {
  const image = {
    buffer: Buffer.from('image'),
    originalname: 'photo.JPG',
    mimetype: 'image/jpeg',
    size: 5,
  };

  it('accepts supported MIME types with matching extensions', () => {
    expect(validateEntryImage(image)).toBe('.jpg');
  });

  it('rejects a mismatched extension', () => {
    expect(() =>
      validateEntryImage({ ...image, originalname: 'photo.png' }),
    ).toThrow(BadRequestException);
  });

  it('rejects an oversized image', () => {
    expect(() =>
      validateEntryImage({ ...image, size: MAX_ENTRY_IMAGE_SIZE + 1 }),
    ).toThrow(BadRequestException);
  });
});
