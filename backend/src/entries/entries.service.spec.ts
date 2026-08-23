import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EntryTag } from './entry-tag.entity';
import { Entry } from './entry.entity';
import { EntryImage } from './entry-image.entity';
import { SettingsService } from '../settings/settings.service';
import { EntriesService } from './entries.service';
import { Tag } from './tag.entity';

describe('EntriesService', () => {
  const entry: Entry = {
    id: '01J00000000000000000000001',
    content: 'test',
    recordedAt: new Date(),
    emotion: null,
    weather: null,
    location: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    entryTags: [],
  };

  function createService(overrides: Record<string, unknown> = {}) {
    const entries = {
      findOne: jest.fn().mockResolvedValue(entry),
      find: jest.fn(),
      create: jest.fn((value: Partial<Entry>) => value),
      save: jest.fn(),
    } as unknown as Repository<Entry>;
    const tags = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ id: '01J00000000000000000000002' }),
      find: jest.fn(),
      create: jest.fn((value: Partial<Tag>) => value),
      save: jest
        .fn()
        .mockImplementation((value: Tag) => Promise.resolve(value)),
      ...overrides,
    } as unknown as Repository<Tag>;
    const entryTags = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: Partial<EntryTag>) => value),
      save: jest
        .fn()
        .mockImplementation((value: EntryTag) => Promise.resolve(value)),
      delete: jest.fn(),
    } as unknown as Repository<EntryTag>;
    const entryImages = {
      create: jest.fn((value: Partial<EntryImage>) => value),
    } as unknown as Repository<EntryImage>;
    const dataSource = { transaction: jest.fn() } as unknown as DataSource;
    const settingsService = {
      findByKey: jest.fn(),
    } as unknown as SettingsService;
    return new EntriesService(
      entries,
      tags,
      entryTags,
      entryImages,
      dataSource,
      settingsService,
    );
  }

  it('returns an existing tag relation without creating another one', async () => {
    const relation = { id: '01J00000000000000000000003' } as EntryTag;
    const service = createService();
    const entryTags = (
      service as unknown as { entryTags: Repository<EntryTag> }
    ).entryTags;
    jest.spyOn(entryTags, 'findOneBy').mockResolvedValue(relation);

    await expect(
      service.attachTag(entry.id, '01J00000000000000000000002'),
    ).resolves.toBe(relation);
  });

  it('reports a missing entry', async () => {
    const service = createService();
    const entries = (service as unknown as { entries: Repository<Entry> })
      .entries;
    jest.spyOn(entries, 'findOne').mockResolvedValue(null);

    await expect(service.findOne(entry.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('translates duplicate tag names to a conflict', async () => {
    const service = createService({
      save: jest.fn().mockRejectedValue({ driverError: { code: '23505' } }),
    });

    await expect(service.createTag({ name: 'work' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
