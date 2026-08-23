import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { createUlid } from '../common/ulid';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { EntryImage } from './entry-image.entity';
import { EntryTag } from './entry-tag.entity';
import { Entry } from './entry.entity';
import { Tag } from './tag.entity';

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
  constructor(
    @InjectRepository(Entry) private readonly entries: Repository<Entry>,
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
    @InjectRepository(EntryTag)
    private readonly entryTags: Repository<EntryTag>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Entry[]> {
    return this.entries.find({
      relations: entryRelations,
      order: { recordedAt: 'DESC', createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Entry> {
    const entry = await this.entries.findOne({
      where: { id },
      relations: entryRelations,
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
    await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EntryTag, { entryId: id });
      await manager.delete(EntryImage, { entryId: id });
      await manager.delete(Entry, { id });
    });
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
}
