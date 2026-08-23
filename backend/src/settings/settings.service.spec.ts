import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  const setting: AppSetting = {
    id: '01J00000000000000000000001',
    key: 'appearance.theme',
    value: 'light',
    description: 'Selected color theme',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createService(findOneBy = jest.fn().mockResolvedValue(setting)) {
    const save = jest
      .fn()
      .mockImplementation((value: AppSetting) => Promise.resolve(value));
    const repository = {
      findOneBy,
      save,
      find: jest.fn(),
    } as unknown as Repository<AppSetting>;
    return { service: new SettingsService(repository), save };
  }

  it('updates a valid theme', async () => {
    const { service, save } = createService();
    await expect(
      service.update('appearance.theme', 'dark'),
    ).resolves.toMatchObject({ value: 'dark' });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'dark' }),
    );
  });

  it('rejects an invalid theme', async () => {
    const { service } = createService();
    await expect(
      service.update('appearance.theme', 'blue'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a missing setting', async () => {
    const { service } = createService(jest.fn().mockResolvedValue(null));
    await expect(service.findByKey('image.root_path')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
