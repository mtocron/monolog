import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSetting } from './app-setting.entity';

export const SETTING_KEYS = ['image.root_path', 'appearance.theme'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly repository: Repository<AppSetting>,
  ) {}

  findAll(): Promise<AppSetting[]> {
    return this.repository.find({ order: { key: 'ASC' } });
  }

  async findByKey(key: SettingKey): Promise<AppSetting> {
    const setting = await this.repository.findOneBy({ key });
    if (!setting) {
      throw new NotFoundException(`Setting '${key}' was not found`);
    }
    return setting;
  }

  async update(key: SettingKey, value: string): Promise<AppSetting> {
    this.validateValue(key, value);
    const setting = await this.findByKey(key);
    setting.value = value;
    return this.repository.save(setting);
  }

  private validateValue(key: SettingKey, value: string): void {
    if (
      key === 'appearance.theme' &&
      !['light', 'dark', 'capture'].includes(value)
    ) {
      throw new BadRequestException(
        'appearance.theme must be light, dark, or capture',
      );
    }
  }
}
