import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, normalize, relative, resolve } from 'node:path';
import { DataSource, Repository } from 'typeorm';
import { createUlid } from '../common/ulid';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { EntryImage } from './entry-image.entity';
import { EntryTag } from './entry-tag.entity';
import { Entry } from './entry.entity';
import { Tag } from './tag.entity';
import { SettingsService } from '../settings/settings.service';
import { UploadedEntryImage, validateEntryImage } from './image-upload';

const entryRelations = { images: true, entryTags: { tag: true } } as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'driverError' in error &&
    typeof error.driverError === 'object' &&
    error.driverError !== null &&
    'code' in error.driverError &&
    error.driverError.code === '23505'
  );
}

@Injectable()
export class EntriesService {
  private readonly logger = new Logger(EntriesService.name);

  constructor(
    @InjectRepository(Entry) private readonly entries: Repository<Entry>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
    @InjectRepository(EntryTag)
    private readonly entryTags: Repository<EntryTag>,
    @InjectRepository(EntryImage)
    private readonly entryImages: Repository<EntryImage>,
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
  ) {}

  findAll(): Promise<Entry[]> {
    return this.entries.find({
      relations: entryRelations,
      order: {
        recordedAt: 'DESC',
        createdAt: 'DESC',
        id: 'DESC',
        images: { sortOrder: 'ASC' },
      },
    });
  }

  async findOne(id: string): Promise<Entry> {
    const entry = await this.entries.findOne({
      where: { id },
      relations: entryRelations,
      order: { images: { sortOrder: 'ASC' } },
    });
    if (!entry) throw new NotFoundException(`Entry '${id}' was not found`);
    return entry;
  }

  async create(dto: CreateEntryDto): Promise<Entry> {
    const entry = this.entries.create({ id: createUlid(), ...dto });
    await this.entries.save(entry);
    return this.findOne(entry.id);
  }

  async update(id: string, dto: UpdateEntryDto): Promise<Entry> {
    const entry = await this.findOne(id);
    Object.assign(entry, dto);
    await this.entries.save(entry);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EntryTag, { entryId: id });
      await manager.delete(EntryImage, { entryId: id });
      await manager.delete(Entry, { id });
    });
    await this.removeImageFiles(entry.images);
  }

  async addImages(
    entryId: string,
    files: UploadedEntryImage[],
  ): Promise<EntryImage[]> {
    if (files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }
    const entry = await this.findOne(entryId);
    const uploads = files.map((file) => ({
      file,
      extension: validateEntryImage(file),
      id: createUlid(),
    }));
    const rootPath = await this.imageRootPath();
    const directory = this.entryImageDirectory(entry.recordedAt);
    const highestSortOrder = entry.images.reduce(
      (highest, image) => Math.max(highest, image.sortOrder),
      -1,
    );
    const images = uploads.map(({ file, extension, id }, index) =>
      this.entryImages.create({
        id,
        entryId,
        filePath: `${directory}/${id}${extension}`,
        originalFileName: file.originalname,
        sortOrder: highestSortOrder + index + 1,
      }),
    );

    const writtenPaths: string[] = [];
    try {
      for (let index = 0; index < uploads.length; index += 1) {
        const absolutePath = this.resolveStoredPath(
          rootPath,
          images[index].filePath,
        );
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, uploads[index].file.buffer, {
          flag: 'wx',
        });
        writtenPaths.push(absolutePath);
      }
      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository(EntryImage).save(images);
      });
      return images;
    } catch (error: unknown) {
      await Promise.all(
        writtenPaths.map(async (filePath) => {
          try {
            await rm(filePath, { force: true });
          } catch (cleanupError: unknown) {
            this.logger.error(
              `Failed to remove orphaned image '${filePath}'`,
              cleanupError,
            );
          }
        }),
      );
      throw error;
    }
  }

  async getImage(
    entryId: string,
    imageId: string,
  ): Promise<{ absolutePath: string; mimeType: string }> {
    const image = await this.findImage(entryId, imageId);
    const absolutePath = this.resolveStoredPath(
      await this.imageRootPath(),
      image.filePath,
    );
    try {
      await access(absolutePath);
    } catch {
      this.logger.error(`Image file is missing: '${absolutePath}'`);
      throw new NotFoundException(`Image '${imageId}' file was not found`);
    }
    return { absolutePath, mimeType: this.mimeTypeFor(image.filePath) };
  }

  async removeImage(entryId: string, imageId: string): Promise<void> {
    const image = await this.findImage(entryId, imageId);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EntryImage, { id: image.id, entryId });
    });
    await this.removeImageFiles([image]);
  }

  findAllTags(): Promise<Tag[]> {
    return this.tags.find({ order: { name: 'ASC' } });
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    try {
      return await this.tags.save(
        this.tags.create({ id: createUlid(), name: dto.name }),
      );
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Tag '${dto.name}' already exists`);
      }
      throw error;
    }
  }

  async attachTag(entryId: string, tagId: string): Promise<EntryTag> {
    await this.findOne(entryId);
    const tag = await this.tags.findOneBy({ id: tagId });
    if (!tag) throw new NotFoundException(`Tag '${tagId}' was not found`);
    const existing = await this.entryTags.findOneBy({ entryId, tagId });
    if (existing) return existing;
    try {
      return await this.entryTags.save(
        this.entryTags.create({ id: createUlid(), entryId, tagId }),
      );
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        const relation = await this.entryTags.findOneBy({ entryId, tagId });
        if (relation) return relation;
      }
      throw error;
    }
  }

  async detachTag(entryId: string, tagId: string): Promise<void> {
    const result = await this.entryTags.delete({ entryId, tagId });
    if (!result.affected)
      throw new NotFoundException('Tag relation was not found');
  }

  private async findImage(
    entryId: string,
    imageId: string,
  ): Promise<EntryImage> {
    const image = await this.dataSource.getRepository(EntryImage).findOneBy({
      id: imageId,
      entryId,
    });
    if (!image) throw new NotFoundException(`Image '${imageId}' was not found`);
    return image;
  }

  private async imageRootPath(): Promise<string> {
    const rootPath = (await this.settingsService.findByKey('image.root_path'))
      .value;
    if (!rootPath) {
      throw new BadRequestException('image.root_path must not be empty');
    }
    return rootPath;
  }

  private entryImageDirectory(recordedAt: Date): string {
    const year = recordedAt.getFullYear().toString();
    const month = String(recordedAt.getMonth() + 1).padStart(2, '0');
    const day = String(recordedAt.getDate()).padStart(2, '0');
    return `entries/${year}/${month}/${day}`;
  }

  private resolveStoredPath(rootPath: string, storedPath: string): string {
    const absoluteRoot = resolve(rootPath);
    const absolutePath = resolve(absoluteRoot, storedPath);
    if (
      relative(absoluteRoot, absolutePath).startsWith('..') ||
      normalize(storedPath).startsWith('..')
    ) {
      throw new BadRequestException('Invalid stored image path');
    }
    return absolutePath;
  }

  private mimeTypeFor(filePath: string): string {
    if (filePath.endsWith('.jpg')) return 'image/jpeg';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.webp')) return 'image/webp';
    throw new NotFoundException('Unsupported stored image type');
  }

  private async removeImageFiles(images: EntryImage[]): Promise<void> {
    const rootPath = await this.imageRootPath();
    await Promise.all(
      images.map(async (image) => {
        const absolutePath = this.resolveStoredPath(rootPath, image.filePath);
        try {
          await rm(absolutePath, { force: true });
        } catch (error: unknown) {
          this.logger.error(`Failed to remove image '${absolutePath}'`, error);
        }
      }),
    );
  }
}
