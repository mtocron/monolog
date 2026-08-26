import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, normalize, relative, resolve } from 'node:path';
import { DataSource, Repository } from 'typeorm';
import { createUlid } from '../common/ulid';
import { SettingsService } from '../settings/settings.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import {
  validatePurchaseImage,
  type UploadedPurchaseImage,
} from './image-upload';
import { PurchaseCategory } from './purchase-category.entity';
import { PurchaseImage } from './purchase-image.entity';
import { Purchase } from './purchase.entity';
import { EntryPurchase } from '../entries/entry-purchase.entity';

const purchaseRelations = {
  purchaseCategory: true,
  images: true,
  entryPurchases: { entry: true },
} as const;

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);
  constructor(
    @InjectRepository(Purchase)
    private readonly purchases: Repository<Purchase>,
    @InjectRepository(PurchaseCategory)
    private readonly categories: Repository<PurchaseCategory>,
    @InjectRepository(PurchaseImage)
    private readonly images: Repository<PurchaseImage>,
    @InjectRepository(EntryPurchase)
    private readonly entryPurchases: Repository<EntryPurchase>,
    private readonly dataSource: DataSource,
    private readonly settingsService: SettingsService,
  ) {}

  findAll(): Promise<Purchase[]> {
    return this.purchases.find({
      relations: purchaseRelations,
      order: {
        purchasedAt: 'DESC',
        createdAt: 'DESC',
        id: 'DESC',
        images: { sortOrder: 'ASC' },
      },
    });
  }
  findAllCategories(): Promise<PurchaseCategory[]> {
    return this.categories.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }
  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchases.findOne({
      where: { id },
      relations: purchaseRelations,
      order: { images: { sortOrder: 'ASC' } },
    });
    if (!purchase)
      throw new NotFoundException(`Purchase '${id}' was not found`);
    return purchase;
  }
  async create(dto: CreatePurchaseDto): Promise<Purchase> {
    await this.requireCategory(dto.purchaseCategoryId);
    const purchase = await this.purchases.save(
      this.purchases.create({ id: createUlid(), ...dto }),
    );
    return this.findOne(purchase.id);
  }
  async update(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
    const purchase = await this.findOne(id);
    if (dto.purchaseCategoryId)
      await this.requireCategory(dto.purchaseCategoryId);
    Object.assign(purchase, dto);
    await this.purchases.save(purchase);
    return this.findOne(id);
  }
  async remove(id: string): Promise<void> {
    const purchase = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PurchaseImage, { purchaseId: id });
      await manager.delete(EntryPurchase, { purchaseId: id });
      await manager.delete(Purchase, { id });
    });
    await this.removeFiles(purchase.images);
  }
  async addImages(
    purchaseId: string,
    files: UploadedPurchaseImage[],
  ): Promise<PurchaseImage[]> {
    if (!files.length)
      throw new BadRequestException('At least one image is required');
    const purchase = await this.findOne(purchaseId);
    const uploads = files.map((file) => ({
      file,
      extension: validatePurchaseImage(file),
      id: createUlid(),
    }));
    const directory = `purchases/${purchase.purchasedAt.replaceAll('-', '/')}`;
    const start =
      purchase.images.reduce(
        (max, image) => Math.max(max, image.sortOrder),
        -1,
      ) + 1;
    const images = uploads.map(({ file, id, extension }, index) =>
      this.images.create({
        id,
        purchaseId,
        filePath: `${directory}/${id}${extension}`,
        originalFileName: file.originalname,
        sortOrder: start + index,
      }),
    );
    const root = await this.imageRootPath();
    const written: string[] = [];
    try {
      for (let index = 0; index < images.length; index += 1) {
        const path = this.resolvePath(root, images[index].filePath);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, uploads[index].file.buffer, { flag: 'wx' });
        written.push(path);
      }
      await this.dataSource.transaction((manager) =>
        manager.getRepository(PurchaseImage).save(images),
      );
      return images;
    } catch (error: unknown) {
      await Promise.all(written.map((path) => rm(path, { force: true })));
      throw error;
    }
  }
  async removeImage(purchaseId: string, imageId: string): Promise<void> {
    const image = await this.findImage(purchaseId, imageId);
    await this.images.delete({ id: imageId, purchaseId });
    await this.removeFiles([image]);
  }
  async getImage(
    purchaseId: string,
    imageId: string,
  ): Promise<{ absolutePath: string; mimeType: string }> {
    const image = await this.findImage(purchaseId, imageId);
    const absolutePath = this.resolvePath(
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
  private async requireCategory(id: string): Promise<void> {
    if (!(await this.categories.existsBy({ id })))
      throw new NotFoundException(`Purchase category '${id}' was not found`);
  }
  private async findImage(
    purchaseId: string,
    imageId: string,
  ): Promise<PurchaseImage> {
    const image = await this.images.findOneBy({ id: imageId, purchaseId });
    if (!image) throw new NotFoundException(`Image '${imageId}' was not found`);
    return image;
  }
  private async imageRootPath(): Promise<string> {
    const root = (await this.settingsService.findByKey('image.root_path'))
      .value;
    if (!root)
      throw new BadRequestException('image.root_path must not be empty');
    return root;
  }
  private resolvePath(root: string, stored: string): string {
    const base = resolve(root);
    const absolute = resolve(base, stored);
    if (
      relative(base, absolute).startsWith('..') ||
      normalize(stored).startsWith('..')
    )
      throw new BadRequestException('Invalid stored image path');
    return absolute;
  }
  private async removeFiles(images: PurchaseImage[]): Promise<void> {
    const root = await this.imageRootPath();
    await Promise.all(
      images.map(async (image) => {
        try {
          await rm(this.resolvePath(root, image.filePath), { force: true });
        } catch (error: unknown) {
          this.logger.error(
            `Failed to remove image '${image.filePath}'`,
            error,
          );
        }
      }),
    );
  }
  private mimeTypeFor(filePath: string): string {
    if (filePath.endsWith('.jpg')) return 'image/jpeg';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.webp')) return 'image/webp';
    throw new NotFoundException('Unsupported stored image type');
  }
}
